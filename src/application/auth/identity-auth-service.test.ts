import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type {
  CoreRepository,
  DrizzleTransactionContext,
  DrizzleTransactionManager,
  IdentityRepository,
  LedgerRepository,
  NotificationRepository,
  OperationsRepository,
} from "@/infrastructure/database";

import { AUTH_COOKIE_NAMES, AUTH_EMAIL_TEMPLATES } from "./constants";
import { IdentityAuthService, type IdentityAuthServiceDependencies } from "./identity-auth-service";
import type { IdentityProvider } from "./identity-provider";
import type { AuthenticationRateLimiter } from "./rate-limiter";
import { hashSessionToken } from "./security";

const serverEnv = {
  NODE_ENV: "test",
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
  DATABASE_URL: "postgres://postgres:postgres@localhost:5432/unique_sky_way_v2",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
  RESEND_API_KEY: "resend-key",
  RESEND_FROM_EMAIL: "security@uniqueskyway.example",
  INTERNAL_JOB_TOKEN: "development-job-token",
  LOG_LEVEL: "info",
};

const requestContext = {
  requestId: "request_1",
  ipAddress: "203.0.113.10",
  userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
  origin: "http://localhost:3000",
};

describe("IdentityAuthService", () => {
  beforeEach(() => {
    for (const [key, value] of Object.entries(serverEnv)) {
      vi.stubEnv(key, value);
    }
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("records a Supabase session projection and sends one new-device email for unknown devices", async () => {
    const { service, fakes } = createService();

    await service.login(
      {
        email: "investor@example.com",
        password: "StrongerPassword123!",
        rememberMe: true,
      },
      requestContext,
    );

    expect(fakes.rateLimiter.recordLoginSuccess).toHaveBeenCalledWith(
      "investor@example.com",
      "203.0.113.10",
    );
    expect(fakes.identityRepository.createTrustedDevice).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        userId: "app_user_1",
        label: "Mac browser",
      }),
    );
    expect(fakes.notificationRepository.enqueueEmail).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        toEmail: "investor@example.com",
        templateKey: AUTH_EMAIL_TEMPLATES.newDeviceSignIn,
      }),
    );
    expect(fakes.identityRepository.ensureSession).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        userId: "app_user_1",
        sessionTokenHash: hashSessionToken("refresh_token_1"),
        trustedDeviceId: "trusted_device_1",
        status: "active",
      }),
    );
    const ensureSessionCalls = fakes.identityRepository.ensureSession.mock
      .calls as unknown as Array<[unknown, { sessionTokenHash: string }]>;
    const persistedSession = ensureSessionCalls[0]?.[1];
    expect(persistedSession).toBeDefined();
    expect(persistedSession?.sessionTokenHash).not.toBe("refresh_token_1");
    expect(fakes.cookies.set).toHaveBeenCalledWith(
      AUTH_COOKIE_NAMES.trustedDevice,
      expect.any(String),
      expect.objectContaining({ httpOnly: true, sameSite: "lax", path: "/" }),
    );
    expect(fakes.operationsRepository.appendAuditLog).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ action: "auth.login", targetId: "app_user_1" }),
    );
  });

  it("verifies signup OTPs, bootstraps identity records, and queues identity emails", async () => {
    const { service, fakes } = createService({
      existingAppUser: createAppUser({ emailVerifiedAt: null }),
    });

    await service.verifyEmail(
      {
        email: "investor@example.com",
        token: "123456",
        rememberMe: true,
      },
      requestContext,
    );

    expect(fakes.identityProvider.verifySignupOtp).toHaveBeenCalledWith(
      "investor@example.com",
      "123456",
    );
    expect(fakes.coreRepository.ensureCustomerProfile).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ userId: "app_user_1", displayName: "Avery Investor" }),
    );
    expect(fakes.ledgerRepository.ensureWallet).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ userId: "app_user_1", currency: "USD" }),
    );

    const enqueueEmailCalls = fakes.notificationRepository.enqueueEmail.mock
      .calls as unknown as Array<[unknown, { templateKey: string }]>;
    const queuedTemplates = enqueueEmailCalls.map((call) => call[1].templateKey);

    expect(queuedTemplates).toEqual(
      expect.arrayContaining([
        AUTH_EMAIL_TEMPLATES.emailVerified,
        AUTH_EMAIL_TEMPLATES.welcome,
        AUTH_EMAIL_TEMPLATES.newDeviceSignIn,
      ]),
    );
    expect(fakes.identityRepository.ensureSession).toHaveBeenCalled();
  });

  it("reuses known trusted devices without sending repeated new-device emails", async () => {
    const trustedDevice = createTrustedDevice();
    const { service, fakes } = createService({
      trustedDeviceCookie: "trusted-device-token",
      trustedDevice,
    });

    await service.login(
      {
        email: "investor@example.com",
        password: "StrongerPassword123!",
        rememberMe: true,
      },
      requestContext,
    );

    expect(fakes.identityRepository.touchTrustedDevice).toHaveBeenCalledWith(
      expect.anything(),
      "trusted_device_1",
      expect.any(Date),
    );
    expect(fakes.identityRepository.createTrustedDevice).not.toHaveBeenCalled();
    expect(fakes.notificationRepository.enqueueEmail).not.toHaveBeenCalled();
    expect(fakes.identityRepository.ensureSession).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ trustedDeviceId: "trusted_device_1" }),
    );
  });

  it("revokes other sessions through Supabase while retaining current-session metadata", async () => {
    const { service, fakes } = createService();

    await service.revokeSessions("others", requestContext);

    expect(fakes.identityRepository.revokeOtherSessions).toHaveBeenCalledWith(
      expect.anything(),
      "app_user_1",
      hashSessionToken("refresh_token_1"),
      expect.any(Date),
    );
    expect(fakes.identityProvider.signOutOtherSessions).toHaveBeenCalledWith("access_token_1");
    expect(fakes.identityProvider.signOutCurrentSession).not.toHaveBeenCalled();
  });
});

function createService(
  options: {
    trustedDeviceCookie?: string;
    trustedDevice?: unknown;
    existingAppUser?: ReturnType<typeof createAppUser>;
  } = {},
) {
  const context = { db: {}, transactionId: "tx_auth_service" } as DrizzleTransactionContext;
  const appUser = createAppUser();
  const authenticated = {
    user: createAuthenticatedUser(),
    session: createAuthenticatedSession(),
  };
  const cookies = new Map<string, string>();
  if (options.trustedDeviceCookie) {
    cookies.set(AUTH_COOKIE_NAMES.trustedDevice, options.trustedDeviceCookie);
  }

  const fakes = {
    identityProvider: {
      verifySignupOtp: vi.fn(async () => authenticated),
      signInWithPassword: vi.fn(async () => authenticated),
      getCurrentUser: vi.fn(async () => authenticated.user),
      getCurrentSession: vi.fn(async () => authenticated.session),
      signOutOtherSessions: vi.fn(async () => undefined),
      signOutCurrentSession: vi.fn(async () => undefined),
    },
    transactionManager: {
      runInTransaction: vi.fn((callback: (tx: DrizzleTransactionContext) => unknown) =>
        callback(context),
      ),
    },
    identityRepository: {
      findUserByAuthUserId: vi.fn(async () => options.existingAppUser ?? appUser),
      ensureUser: vi.fn(async () => appUser),
      markEmailVerified: vi.fn(async () => appUser),
      findTrustedDeviceByTokenHash: vi.fn(async () => options.trustedDevice ?? null),
      createTrustedDevice: vi.fn(async () => createTrustedDevice()),
      touchTrustedDevice: vi.fn(async () => options.trustedDevice ?? createTrustedDevice()),
      ensureSession: vi.fn(async () => createSessionRecord()),
      findSessionByTokenHash: vi.fn(async () => createSessionRecord()),
      revokeSession: vi.fn(async () => createSessionRecord({ status: "revoked" })),
      revokeOtherSessions: vi.fn(async () => [createSessionRecord({ status: "revoked" })]),
    },
    coreRepository: {
      ensureCustomerProfile: vi.fn(async () => ({ id: "profile_1" })),
      ensureCustomerAccount: vi.fn(async () => ({ id: "account_1" })),
    },
    ledgerRepository: {
      ensureWallet: vi.fn(async () => ({ id: "wallet_1" })),
      ensureLedgerAccount: vi.fn(async () => ({ id: "ledger_account_1" })),
      ensureWalletAccountLink: vi.fn(async () => undefined),
    },
    notificationRepository: {
      enqueueEmail: vi.fn(async () => ({ id: "email_1" })),
      enqueueOutboxEvent: vi.fn(async () => ({ id: "outbox_1" })),
    },
    operationsRepository: {
      appendAuditLog: vi.fn(async () => ({ id: "audit_1" })),
    },
    rateLimiter: {
      checkLogin: vi.fn(() => ({ allowed: true })),
      recordLoginSuccess: vi.fn(),
      recordLoginFailure: vi.fn(() => ({ allowed: true })),
      checkOtp: vi.fn(() => ({ allowed: true })),
      checkPasswordReset: vi.fn(() => ({ allowed: true })),
    },
    cookies: {
      get: vi.fn((name: string) => cookies.get(name)),
      set: vi.fn((name: string, value: string) => cookies.set(name, value)),
      delete: vi.fn((name: string) => cookies.delete(name)),
    },
  };

  const deps: IdentityAuthServiceDependencies = {
    identityProvider: fakes.identityProvider as unknown as IdentityProvider,
    transactionManager: fakes.transactionManager as unknown as DrizzleTransactionManager,
    identityRepository: fakes.identityRepository as unknown as IdentityRepository,
    coreRepository: fakes.coreRepository as unknown as CoreRepository,
    ledgerRepository: fakes.ledgerRepository as unknown as LedgerRepository,
    notificationRepository: fakes.notificationRepository as unknown as NotificationRepository,
    operationsRepository: fakes.operationsRepository as unknown as OperationsRepository,
    rateLimiter: fakes.rateLimiter as unknown as AuthenticationRateLimiter,
    cookies: fakes.cookies,
  };

  return {
    service: new IdentityAuthService(deps),
    fakes,
  };
}

function createAuthenticatedUser() {
  return {
    authUserId: "auth_user_1",
    email: "investor@example.com",
    emailVerifiedAt: new Date("2026-07-12T12:00:00.000Z"),
    displayName: "Avery Investor",
  };
}

function createAuthenticatedSession() {
  return {
    accessToken: "access_token_1",
    refreshToken: "refresh_token_1",
    expiresAt: new Date("2026-07-12T13:00:00.000Z"),
  };
}

function createAppUser(overrides: Record<string, unknown> = {}) {
  const now = new Date("2026-07-12T12:00:00.000Z");

  return {
    id: "app_user_1",
    authUserId: "auth_user_1",
    email: "investor@example.com",
    emailVerifiedAt: now,
    status: "active",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function createTrustedDevice(overrides: Record<string, unknown> = {}) {
  const now = new Date("2026-07-12T12:00:00.000Z");

  return {
    id: "trusted_device_1",
    userId: "app_user_1",
    deviceTokenHash: "trusted_device_hash_1",
    label: "Mac browser",
    lastUsedAt: now,
    expiresAt: new Date("2027-01-08T12:00:00.000Z"),
    revokedAt: null,
    createdAt: now,
    ...overrides,
  };
}

function createSessionRecord(overrides: Record<string, unknown> = {}) {
  const now = new Date("2026-07-12T12:00:00.000Z");

  return {
    id: "session_1",
    userId: "app_user_1",
    supabaseSessionId: null,
    sessionTokenHash: hashSessionToken("refresh_token_1"),
    trustedDeviceId: "trusted_device_1",
    status: "active",
    stepUpVerifiedAt: null,
    lastSeenAt: now,
    expiresAt: new Date("2026-07-12T13:00:00.000Z"),
    revokedAt: null,
    ipAddressHash: "ip_hash_1",
    userAgentHash: "ua_hash_1",
    createdAt: now,
    ...overrides,
  };
}
