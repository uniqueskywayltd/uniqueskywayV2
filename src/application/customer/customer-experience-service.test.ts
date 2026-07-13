import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { IdentityProvider } from "@/application/auth";
import type { ObjectStorage } from "@/application/ports";
import type {
  CoreRepository,
  DrizzleTransactionContext,
  DrizzleTransactionManager,
  IdentityRepository,
  NotificationRepository,
  OperationsRepository,
} from "@/infrastructure/database";

import { CustomerExperienceService } from "./customer-experience-service";

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

const auditContext = {
  requestId: "request_1",
  ipAddressHash: "ip_hash",
  userAgentHash: "ua_hash",
};

describe("CustomerExperienceService", () => {
  beforeEach(() => {
    for (const [key, value] of Object.entries(serverEnv)) {
      vi.stubEnv(key, value);
    }
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("builds customer summary without financial data", async () => {
    const { service, fakes } = createService();

    const summary = await service.getCustomerSummary();

    expect(summary.user.email).toBe("investor@example.com");
    expect(summary.profile?.avatarUrl).toContain("/customer-avatars/");
    expect(summary.unreadNotificationCount).toBe(2);
    expect(fakes.coreRepository.findCustomerProfileByUserId).toHaveBeenCalledWith("app_user_1");
    expect(JSON.stringify(summary)).not.toContain("balance");
    expect(JSON.stringify(summary)).not.toContain("investment");
  });

  it("updates preferences and synchronizes notification preferences", async () => {
    const { service, fakes } = createService();

    const result = await service.updatePreferences(
      {
        appearance: "dark",
        language: "en",
        timeZone: "America/New_York",
        inAppNotificationsEnabled: false,
        securityEmailsEnabled: true,
        productEmailsEnabled: false,
        marketingEmailsEnabled: false,
      },
      auditContext,
    );

    expect(result.notificationPreferences).toEqual({
      inApp: { account: false, security: false, product: false },
      email: { security: true, product: false, marketing: false },
    });
    expect(fakes.coreRepository.updateCustomerPreferences).toHaveBeenCalledWith(
      expect.anything(),
      "app_user_1",
      expect.objectContaining({ appearance: "dark", inAppNotificationsEnabled: false }),
    );
    expect(fakes.notificationRepository.upsertNotificationPreference).toHaveBeenCalledTimes(6);
    expect(fakes.operationsRepository.appendAuditLog).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ action: "customer.preferences_updated" }),
    );
  });

  it("uploads only compressed WebP avatar data through object storage", async () => {
    const { service, fakes } = createService();

    await service.uploadAvatar(
      {
        body: new ArrayBuffer(64),
        contentType: "image/webp",
      },
      auditContext,
    );

    expect(fakes.objectStorage.upload).toHaveBeenCalledWith(
      expect.objectContaining({
        bucket: "customer-avatars",
        contentType: "image/webp",
        upsert: true,
      }),
    );
    expect(fakes.coreRepository.updateCustomerAvatar).toHaveBeenCalledWith(
      expect.anything(),
      "app_user_1",
      expect.objectContaining({ avatarContentType: "image/webp" }),
    );
  });

  it("rejects non-WebP avatar uploads", async () => {
    const { service, fakes } = createService();

    await expect(
      service.uploadAvatar(
        {
          body: new ArrayBuffer(64),
          contentType: "image/png",
        },
        auditContext,
      ),
    ).rejects.toThrow("Avatar must be uploaded as a WebP image.");

    expect(fakes.objectStorage.upload).not.toHaveBeenCalled();
  });
});

function createService() {
  const context = { db: {}, transactionId: "tx_customer_experience" } as DrizzleTransactionContext;
  const appUser = {
    id: "app_user_1",
    authUserId: "auth_user_1",
    email: "investor@example.com",
    emailVerifiedAt: new Date("2026-07-13T07:00:00.000Z"),
    status: "active",
    createdAt: new Date("2026-07-13T07:00:00.000Z"),
    updatedAt: new Date("2026-07-13T07:00:00.000Z"),
  };
  const profile = {
    id: "profile_1",
    userId: "app_user_1",
    legalName: "Avery Investor",
    displayName: "Avery",
    phone: null,
    country: "US",
    stateRegion: "NY",
    dateOfBirth: null,
    avatarStoragePath: "avatars/app_user_1/avatar.webp",
    avatarContentType: "image/webp",
    avatarUpdatedAt: new Date("2026-07-13T07:00:00.000Z"),
    onboardingStatus: "not_started",
    kycStatus: "not_started",
    riskStatus: "not_reviewed",
    termsAcceptedAt: null,
    termsVersion: null,
    createdAt: new Date("2026-07-13T07:00:00.000Z"),
    updatedAt: new Date("2026-07-13T07:00:00.000Z"),
  };
  const preferences = {
    id: "preferences_1",
    userId: "app_user_1",
    appearance: "dark",
    language: "en",
    timeZone: "America/New_York",
    inAppNotificationsEnabled: false,
    securityEmailsEnabled: true,
    productEmailsEnabled: false,
    marketingEmailsEnabled: false,
    createdAt: new Date("2026-07-13T07:00:00.000Z"),
    updatedAt: new Date("2026-07-13T07:00:00.000Z"),
  };
  const fakes = {
    identityProvider: {
      getCurrentUser: vi.fn(async () => ({
        authUserId: "auth_user_1",
        email: "investor@example.com",
        emailVerifiedAt: new Date("2026-07-13T07:00:00.000Z"),
        displayName: "Avery",
      })),
    },
    transactionManager: {
      runInTransaction: vi.fn((callback: (tx: DrizzleTransactionContext) => unknown) =>
        callback(context),
      ),
    },
    identityRepository: {
      findUserByAuthUserId: vi.fn(async () => appUser),
    },
    coreRepository: {
      findCustomerProfileByUserId: vi.fn(async () => profile),
      findCustomerAccountByUserId: vi.fn(async () => ({
        id: "account_1",
        userId: "app_user_1",
        accountNumber: "USW-123",
        status: "active",
        restrictionReason: null,
        openedAt: new Date("2026-07-13T07:00:00.000Z"),
        closedAt: null,
        createdAt: new Date("2026-07-13T07:00:00.000Z"),
        updatedAt: new Date("2026-07-13T07:00:00.000Z"),
      })),
      findCustomerPreferencesByUserId: vi.fn(async () => preferences),
      ensureCustomerProfile: vi.fn(async () => profile),
      updateCustomerProfile: vi.fn(async () => profile),
      updateCustomerAvatar: vi.fn(async () => profile),
      ensureCustomerPreferences: vi.fn(async () => preferences),
      updateCustomerPreferences: vi.fn(async () => preferences),
    },
    notificationRepository: {
      countUnreadNotificationsByUserId: vi.fn(async () => 2),
      listNotificationPreferencesByUserId: vi.fn(async () => []),
      upsertNotificationPreference: vi.fn(async () => ({ id: "preference_1" })),
      listNotificationsByUserId: vi.fn(async () => []),
      markNotificationRead: vi.fn(async () => ({ id: "notification_1" })),
    },
    operationsRepository: {
      appendAuditLog: vi.fn(async () => ({ id: "audit_1" })),
      listAuditLogsByActorUserId: vi.fn(async () => []),
      listSecurityEventsByUserId: vi.fn(async () => []),
    },
    objectStorage: {
      upload: vi.fn(async () => ({
        bucket: "customer-avatars",
        path: "avatars/app_user_1/avatar.webp",
        publicUrl:
          "https://example.supabase.co/storage/v1/object/public/customer-avatars/avatars/app_user_1/avatar.webp",
      })),
      getPublicUrl: vi.fn(
        () =>
          "https://example.supabase.co/storage/v1/object/public/customer-avatars/avatars/app_user_1/avatar.webp",
      ),
    },
  };

  return {
    service: new CustomerExperienceService({
      identityProvider: fakes.identityProvider as unknown as IdentityProvider,
      transactionManager: fakes.transactionManager as unknown as DrizzleTransactionManager,
      identityRepository: fakes.identityRepository as unknown as IdentityRepository,
      coreRepository: fakes.coreRepository as unknown as CoreRepository,
      notificationRepository: fakes.notificationRepository as unknown as NotificationRepository,
      operationsRepository: fakes.operationsRepository as unknown as OperationsRepository,
      objectStorage: fakes.objectStorage as unknown as ObjectStorage,
    }),
    fakes,
  };
}
