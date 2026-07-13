import "server-only";

import { AppError } from "@/application/errors";
import { getServerEnv } from "@/config/server-env";
import type {
  CoreRepository,
  DrizzleTransactionContext,
  DrizzleTransactionManager,
  IdentityRepository,
  LedgerRepository,
  NotificationRepository,
  OperationsRepository,
} from "@/infrastructure/database";

import { AUTH_COOKIE_NAMES, AUTH_EMAIL_TEMPLATES, AUTH_ROUTES } from "./constants";
import { IdentityEmailQueue } from "./identity-email-queue";
import type { AuthenticatedSession, AuthenticatedUser, IdentityProvider } from "./identity-provider";
import { CustomerIdentityBootstrapService } from "./profile-bootstrap";
import type { AuthenticationRateLimiter } from "./rate-limiter";
import {
  createDeviceLabel,
  createTrustedDeviceToken,
  hashIpAddress,
  hashSessionToken,
  hashTrustedDeviceToken,
  hashUserAgent,
  trustedDeviceExpiresAt,
  type RequestSecurityContext,
} from "./security";
import type {
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
  VerifyEmailInput,
} from "./schemas";

export interface AuthCookieAdapter {
  get(name: string): string | undefined;
  set(name: string, value: string, options: AuthCookieOptions): void;
  delete(name: string): void;
}

export interface AuthCookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax" | "strict";
  path: string;
  expires?: Date;
  maxAge?: number;
}

export interface IdentityAuthServiceDependencies {
  identityProvider: IdentityProvider;
  transactionManager: DrizzleTransactionManager;
  identityRepository: IdentityRepository;
  coreRepository: CoreRepository;
  ledgerRepository: LedgerRepository;
  notificationRepository: NotificationRepository;
  operationsRepository: OperationsRepository;
  rateLimiter: AuthenticationRateLimiter;
  cookies: AuthCookieAdapter;
}

export class IdentityAuthService {
  private readonly emailQueue: IdentityEmailQueue;
  private readonly bootstrapper: CustomerIdentityBootstrapService;

  constructor(private readonly deps: IdentityAuthServiceDependencies) {
    this.emailQueue = new IdentityEmailQueue(deps.notificationRepository);
    this.bootstrapper = new CustomerIdentityBootstrapService(
      deps.coreRepository,
      deps.ledgerRepository,
    );
  }

  async register(input: RegisterInput, context: RequestSecurityContext) {
    const appUrl = getServerEnv().NEXT_PUBLIC_APP_URL;
    const generatedEmail = await this.deps.identityProvider.generateSignupEmail({
      email: input.email,
      password: input.password,
      redirectTo: `${appUrl}${AUTH_ROUTES.verifyEmail}`,
      ...(input.displayName ? { displayName: input.displayName } : {}),
    });

    await this.deps.transactionManager.runInTransaction(async (tx) => {
      const appUser = await this.deps.identityRepository.ensureUser(tx, {
        authUserId: generatedEmail.authUserId,
        email: generatedEmail.email.toLowerCase(),
        emailVerifiedAt: null,
        status: "active",
      });

      await this.emailQueue.enqueue(tx, {
        recipientUserId: appUser.id,
        toEmail: appUser.email,
        templateKey: AUTH_EMAIL_TEMPLATES.verifyEmail,
        idempotencyKey: `auth.verify_email:${appUser.id}`,
        metadata: {
          otp: generatedEmail.emailOtp,
          actionLink: generatedEmail.actionLink,
          hashedToken: generatedEmail.hashedToken,
        },
      });

      await this.appendAudit(tx, appUser.id, "auth.registered", "user", appUser.id, context);
    });

    return {
      email: generatedEmail.email,
      verificationRequired: true,
    };
  }

  async verifyEmail(input: VerifyEmailInput, context: RequestSecurityContext) {
    const authenticated = await this.deps.identityProvider.verifySignupOtp(
      input.email,
      input.token,
    );
    const appUser = await this.ensureVerifiedAppUser(authenticated.user, context);

    await this.deps.transactionManager.runInTransaction(async (tx) => {
      await this.emailQueue.enqueue(tx, {
        recipientUserId: appUser.id,
        toEmail: appUser.email,
        templateKey: AUTH_EMAIL_TEMPLATES.emailVerified,
        idempotencyKey: `auth.email_verified:${appUser.id}:${authenticated.user.emailVerifiedAt?.toISOString() ?? "verified"}`,
        metadata: {},
      });
      await this.emailQueue.enqueue(tx, {
        recipientUserId: appUser.id,
        toEmail: appUser.email,
        templateKey: AUTH_EMAIL_TEMPLATES.welcome,
        idempotencyKey: `auth.welcome:${appUser.id}`,
        metadata: {},
      });
    });

    await this.recordSessionAndDevice(appUser.id, appUser.email, authenticated.session, context);

    return { userId: appUser.id, email: appUser.email };
  }

  async login(input: LoginInput, context: RequestSecurityContext) {
    const rateLimit = this.deps.rateLimiter.checkLogin(input.email, context.ipAddress);
    if (!rateLimit.allowed) {
      throw new AppError({
        code: "RATE_LIMITED",
        message: "Too many login attempts. Try again later.",
        details: { retryAfterSeconds: rateLimit.retryAfterSeconds },
      });
    }

    try {
      const authenticated = await this.deps.identityProvider.signInWithPassword(
        input.email,
        input.password,
      );
      this.deps.rateLimiter.recordLoginSuccess(input.email, context.ipAddress);
      const appUser = await this.ensureVerifiedAppUser(authenticated.user, context);
      await this.recordSessionAndDevice(appUser.id, appUser.email, authenticated.session, context);
      return { userId: appUser.id, email: appUser.email };
    } catch (error) {
      const failed = this.deps.rateLimiter.recordLoginFailure(input.email, context.ipAddress);

      if (!failed.allowed) {
        await this.queueAccountLockedEmail(input.email, failed.lockedUntil, context);
      }

      throw error;
    }
  }

  async forgotPassword(input: ForgotPasswordInput, context: RequestSecurityContext) {
    const rateLimit = this.deps.rateLimiter.checkPasswordReset(input.email, context.ipAddress);
    if (!rateLimit.allowed) {
      throw new AppError({
        code: "RATE_LIMITED",
        message: "Too many password reset attempts. Try again later.",
        details: { retryAfterSeconds: rateLimit.retryAfterSeconds },
      });
    }

    const appUrl = getServerEnv().NEXT_PUBLIC_APP_URL;
    const generatedEmail = await this.deps.identityProvider.generatePasswordResetEmail({
      email: input.email,
      redirectTo: `${appUrl}${AUTH_ROUTES.resetPassword}`,
    });

    if (generatedEmail) {
      const appUser = await this.deps.identityRepository.findUserByAuthUserId(
        generatedEmail.authUserId,
      );

      await this.deps.transactionManager.runInTransaction(async (tx) => {
        await this.emailQueue.enqueue(tx, {
          recipientUserId: appUser?.id ?? null,
          toEmail: generatedEmail.email,
          templateKey: AUTH_EMAIL_TEMPLATES.passwordReset,
          idempotencyKey: `auth.password_reset:${generatedEmail.authUserId}:${generatedEmail.hashedToken}`,
          metadata: {
            otp: generatedEmail.emailOtp,
            actionLink: generatedEmail.actionLink,
            hashedToken: generatedEmail.hashedToken,
          },
        });

        if (appUser) {
          await this.appendAudit(
            tx,
            appUser.id,
            "auth.password_reset_requested",
            "user",
            appUser.id,
            context,
          );
        }
      });
    }

    return { accepted: true };
  }

  async resetPassword(input: ResetPasswordInput, context: RequestSecurityContext) {
    const authenticated = await this.deps.identityProvider.resetPasswordWithOtp(input);
    const appUser = await this.ensureVerifiedAppUser(authenticated.user, context);

    await this.deps.transactionManager.runInTransaction(async (tx) => {
      await this.emailQueue.enqueue(tx, {
        recipientUserId: appUser.id,
        toEmail: appUser.email,
        templateKey: AUTH_EMAIL_TEMPLATES.passwordChanged,
        idempotencyKey: `auth.password_changed:${appUser.id}:${Date.now()}`,
        metadata: {},
      });
      await this.appendAudit(tx, appUser.id, "auth.password_changed", "user", appUser.id, context);
    });

    await this.recordSessionAndDevice(appUser.id, appUser.email, authenticated.session, context);

    return { userId: appUser.id };
  }

  async changePassword(input: ChangePasswordInput, context: RequestSecurityContext) {
    const user = await this.requireCurrentUser();
    const appUser = await this.deps.identityRepository.findUserByAuthUserId(user.authUserId);
    if (!appUser) {
      throw new AppError({
        code: "AUTHENTICATION_ERROR",
        message: "Authenticated user is not registered.",
      });
    }

    await this.deps.identityProvider.signInWithPassword(appUser.email, input.currentPassword);
    await this.deps.identityProvider.changePassword(input.newPassword);

    await this.deps.transactionManager.runInTransaction(async (tx) => {
      await this.emailQueue.enqueue(tx, {
        recipientUserId: appUser.id,
        toEmail: appUser.email,
        templateKey: AUTH_EMAIL_TEMPLATES.passwordChanged,
        idempotencyKey: `auth.password_changed:${appUser.id}:${Date.now()}`,
        metadata: {},
      });
      await this.appendAudit(tx, appUser.id, "auth.password_changed", "user", appUser.id, context);
    });

    return { changed: true };
  }

  async logout(context: RequestSecurityContext) {
    const user = await this.deps.identityProvider.getCurrentUser();
    const session = await this.deps.identityProvider.getCurrentSession();

    if (user && session) {
      const appUser = await this.deps.identityRepository.findUserByAuthUserId(user.authUserId);
      if (appUser) {
        const sessionHash = hashSessionToken(session.refreshToken);
        const appSession = await this.deps.identityRepository.findSessionByTokenHash(
          appUser.id,
          sessionHash,
        );
        await this.deps.transactionManager.runInTransaction(async (tx) => {
          if (appSession) {
            await this.deps.identityRepository.revokeSession(tx, appSession.id, new Date());
          }
          await this.appendAudit(tx, appUser.id, "auth.logout", "user", appUser.id, context);
        });
      }
    }

    await this.deps.identityProvider.signOutCurrentSession();
    return { signedOut: true };
  }

  async refreshSession(context: RequestSecurityContext) {
    const authenticated = await this.deps.identityProvider.refreshSession();
    const appUser = await this.ensureVerifiedAppUser(authenticated.user, context);
    await this.recordSessionAndDevice(appUser.id, appUser.email, authenticated.session, context);
    return { refreshed: true };
  }

  async listTrustedDevices() {
    const appUser = await this.requireCurrentAppUser();
    return this.deps.identityRepository.listTrustedDevicesByUserId(appUser.id);
  }

  async revokeTrustedDevice(trustedDeviceId: string, context: RequestSecurityContext) {
    const appUser = await this.requireCurrentAppUser();
    await this.deps.transactionManager.runInTransaction(async (tx) => {
      await this.deps.identityRepository.revokeTrustedDeviceForUser(
        tx,
        appUser.id,
        trustedDeviceId,
        new Date(),
      );
      await this.appendAudit(
        tx,
        appUser.id,
        "auth.trusted_device_revoked",
        "trusted_device",
        trustedDeviceId,
        context,
      );
    });

    return { revoked: true };
  }

  async listSessions() {
    const appUser = await this.requireCurrentAppUser();
    const currentSession = await this.deps.identityProvider.getCurrentSession();
    const currentSessionTokenHash = currentSession
      ? hashSessionToken(currentSession.refreshToken)
      : null;
    const sessions = await this.deps.identityRepository.listSessionsByUserId(appUser.id);

    return sessions.map((session) => ({
      ...session,
      current: currentSessionTokenHash === session.sessionTokenHash,
    }));
  }

  async revokeSessions(mode: "current" | "others", context: RequestSecurityContext) {
    const user = await this.requireCurrentUser();
    const appUser = await this.requireCurrentAppUser();
    const session = await this.deps.identityProvider.getCurrentSession();

    if (!session) {
      throw new AppError({ code: "AUTHENTICATION_ERROR", message: "No active session." });
    }

    const currentSessionTokenHash = hashSessionToken(session.refreshToken);

    await this.deps.transactionManager.runInTransaction(async (tx) => {
      if (mode === "current") {
        const current = await this.deps.identityRepository.findSessionByTokenHash(
          appUser.id,
          currentSessionTokenHash,
        );
        if (current) {
          await this.deps.identityRepository.revokeSession(tx, current.id, new Date());
        }
      } else {
        await this.deps.identityRepository.revokeOtherSessions(
          tx,
          appUser.id,
          currentSessionTokenHash,
          new Date(),
        );
      }

      await this.appendAudit(
        tx,
        appUser.id,
        `auth.sessions_revoked.${mode}`,
        "user",
        appUser.id,
        context,
      );
    });

    if (mode === "current") {
      await this.deps.identityProvider.signOutCurrentSession();
    } else {
      await this.deps.identityProvider.signOutOtherSessions(session.accessToken);
    }

    return { revoked: true, authUserId: user.authUserId };
  }

  async getEmailVerificationStatus() {
    const user = await this.deps.identityProvider.getCurrentUser();
    if (!user) return { authenticated: false, emailVerified: false };

    return {
      authenticated: true,
      email: user.email ?? null,
      emailVerified: Boolean(user.emailVerifiedAt),
    };
  }

  private async ensureVerifiedAppUser(user: AuthenticatedUser, context: RequestSecurityContext) {
    const verifiedAt = user.emailVerifiedAt;

    if (!user.email) {
      throw new AppError({
        code: "AUTHENTICATION_ERROR",
        message: "Authenticated user has no email.",
      });
    }

    if (!verifiedAt) {
      throw new AppError({
        code: "AUTHENTICATION_ERROR",
        message: "Email verification is required.",
      });
    }

    const existingAppUser = await this.deps.identityRepository.findUserByAuthUserId(
      user.authUserId,
    );

    return this.deps.transactionManager.runInTransaction(async (tx) => {
      const appUser = await this.deps.identityRepository.ensureUser(tx, {
        authUserId: user.authUserId,
        email: user.email!.toLowerCase(),
        emailVerifiedAt: verifiedAt,
        status: "active",
      });

      await this.deps.identityRepository.markEmailVerified(tx, appUser.id, verifiedAt);
      await this.bootstrapper.bootstrap(tx, {
        userId: appUser.id,
        displayName: user.displayName,
      });

      if (!existingAppUser?.emailVerifiedAt) {
        await this.appendAudit(tx, appUser.id, "auth.email_verified", "user", appUser.id, context);
      }

      return appUser;
    });
  }

  private async recordSessionAndDevice(
    appUserId: string,
    email: string,
    session: AuthenticatedSession,
    context: RequestSecurityContext,
  ) {
    const now = new Date();
    const sessionTokenHash = hashSessionToken(session.refreshToken);
    const existingDeviceToken = this.deps.cookies.get(AUTH_COOKIE_NAMES.trustedDevice);
    const deviceToken = existingDeviceToken ?? createTrustedDeviceToken();
    const deviceTokenHash = hashTrustedDeviceToken(deviceToken);
    const knownDevice = await this.deps.identityRepository.findTrustedDeviceByTokenHash(
      appUserId,
      deviceTokenHash,
    );
    const deviceExpiresAt = trustedDeviceExpiresAt(now);

    await this.deps.transactionManager.runInTransaction(async (tx) => {
      let trustedDeviceId = knownDevice?.id;

      if (knownDevice) {
        await this.deps.identityRepository.touchTrustedDevice(tx, knownDevice.id, now);
      } else {
        const device = await this.deps.identityRepository.createTrustedDevice(tx, {
          userId: appUserId,
          deviceTokenHash,
          label: createDeviceLabel(context.userAgent),
          lastUsedAt: now,
          expiresAt: deviceExpiresAt,
        });
        trustedDeviceId = device.id;

        await this.emailQueue.enqueue(tx, {
          recipientUserId: appUserId,
          toEmail: email,
          templateKey: AUTH_EMAIL_TEMPLATES.newDeviceSignIn,
          idempotencyKey: `auth.new_device:${appUserId}:${deviceTokenHash}`,
          metadata: {
            deviceLabel: device.label,
            ipAddressSeen: Boolean(context.ipAddress),
          },
        });
      }

      await this.deps.identityRepository.ensureSession(tx, {
        userId: appUserId,
        sessionTokenHash,
        trustedDeviceId: trustedDeviceId ?? null,
        status: "active",
        lastSeenAt: now,
        expiresAt: session.expiresAt,
        ipAddressHash: hashIpAddress(context.ipAddress),
        userAgentHash: hashUserAgent(context.userAgent),
      });

      await this.appendAudit(tx, appUserId, "auth.login", "user", appUserId, context);
    });

    this.deps.cookies.set(AUTH_COOKIE_NAMES.trustedDevice, deviceToken, {
      httpOnly: true,
      secure: getServerEnv().NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: deviceExpiresAt,
    });
  }

  private async queueAccountLockedEmail(
    email: string,
    lockedUntil: Date | undefined,
    context: RequestSecurityContext,
  ) {
    const appUser = await this.deps.identityRepository.findUserByEmail(email);
    if (!appUser) return;

    await this.deps.transactionManager.runInTransaction(async (tx) => {
      await this.emailQueue.enqueue(tx, {
        recipientUserId: appUser.id,
        toEmail: appUser.email,
        templateKey: AUTH_EMAIL_TEMPLATES.accountLocked,
        idempotencyKey: `auth.account_locked:${appUser.id}:${lockedUntil?.toISOString() ?? "window"}`,
        metadata: {
          lockedUntil: lockedUntil?.toISOString() ?? null,
        },
      });
      await this.appendAudit(tx, appUser.id, "auth.account_locked", "user", appUser.id, context);
    });
  }

  private async requireCurrentUser() {
    const user = await this.deps.identityProvider.getCurrentUser();

    if (!user) {
      throw new AppError({ code: "AUTHENTICATION_ERROR", message: "Authentication is required." });
    }

    return user;
  }

  private async requireCurrentAppUser() {
    const user = await this.requireCurrentUser();
    const appUser = await this.deps.identityRepository.findUserByAuthUserId(user.authUserId);

    if (!appUser) {
      throw new AppError({
        code: "AUTHENTICATION_ERROR",
        message: "Authenticated user is not registered.",
      });
    }

    return appUser;
  }

  private async appendAudit(
    tx: DrizzleTransactionContext,
    actorUserId: string,
    action: string,
    targetType: string,
    targetId: string,
    context: RequestSecurityContext,
  ) {
    await this.deps.operationsRepository.appendAuditLog(tx, {
      actorUserId,
      actorType: "customer",
      action,
      targetType,
      targetId,
      requestId: context.requestId,
      ipAddressHash: hashIpAddress(context.ipAddress),
      userAgentHash: hashUserAgent(context.userAgent),
    });
  }
}
