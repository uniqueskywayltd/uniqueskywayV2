import "server-only";

import { AppError, isAppError } from "@/application/errors";
import { resolvePublicAppUrl } from "@/config/public-app-url";
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
import { logger } from "@/infrastructure/logging/logger";

import { buildAuthEmailAction } from "./auth-email-links";
import {
  AUTH_COOKIE_NAMES,
  AUTH_EMAIL_TEMPLATES,
  AUTH_ROUTES,
  PENDING_VERIFY_TTL_SECONDS,
  SIGNUP_WELCOME_DELAY_MS,
} from "./constants";
import { IdentityEmailQueue } from "./identity-email-queue";
import type {
  AuthenticatedSession,
  AuthenticatedUser,
  IdentityProvider,
} from "./identity-provider";
import {
  CustomerIdentityBootstrapService,
  normalizeIsoCountry,
  normalizeRegionLabel,
} from "./profile-bootstrap";
import type { AuthenticationRateLimiter } from "./rate-limiter";
import {
  createTrustedDeviceToken,
  hashIpAddress,
  hashSessionToken,
  hashTrustedDeviceToken,
  hashUserAgent,
  maskIpAddress,
  parseDeviceFingerprint,
  sha256,
  trustedDeviceExpiresAt,
  type RequestSecurityContext,
} from "./security";
import type {
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResendVerificationInput,
  ResetPasswordInput,
  VerifyEmailInput,
  VerifyEmailLinkInput,
  VerifyRecoveryOtpInput,
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
      deps.notificationRepository,
    );
  }

  async register(input: RegisterInput, context: RequestSecurityContext) {
    const username = input.username?.trim();
    const displayName = username || input.displayName?.trim() || undefined;
    const legalName = input.legalName?.trim() || input.displayName?.trim() || undefined;

    if (username) {
      const existingUsername =
        await this.deps.coreRepository.findCustomerProfileByDisplayName(username);
      if (existingUsername) {
        throw new AppError({
          code: "VALIDATION_ERROR",
          message: "This username is already taken.",
        });
      }
    }

    const existingEmail = await this.deps.identityRepository.findUserByEmail(input.email);
    if (existingEmail) {
      throw new AppError({
        code: "VALIDATION_ERROR",
        message: "This email address is already registered.",
      });
    }

    const appUrl = resolvePublicAppUrl(getServerEnv().NEXT_PUBLIC_APP_URL);
    const redirectTo = `${appUrl}${AUTH_ROUTES.verifyEmail}`;
    let authUserId: string | null = null;

    try {
      const generatedEmail = await this.deps.identityProvider.generateSignupEmail({
        email: input.email,
        password: input.password,
        redirectTo,
        ...(displayName ? { displayName } : {}),
      });
      authUserId = generatedEmail.authUserId;
      logger.info(
        {
          event: "auth.registration.token_generated",
          requestId: context.requestId,
          toEmail: generatedEmail.email,
          authUserId: generatedEmail.authUserId,
          otpGenerated: generatedEmail.emailOtp.length > 0,
          otpLength: generatedEmail.emailOtp.length,
          tokenHashGenerated: generatedEmail.hashedToken.length > 0,
          tokenHashLength: generatedEmail.hashedToken.length,
          actionLinkGenerated: generatedEmail.actionLink.length > 0,
        },
        "Signup OTP and verification token generated",
      );

      const authEmail = buildAuthEmailAction({
        properties: {
          actionLink: generatedEmail.actionLink,
          hashedToken: generatedEmail.hashedToken,
          emailOtp: generatedEmail.emailOtp,
        },
        flow: "signup",
        email: generatedEmail.email,
        appUrl,
      });
      if (!authEmail.otp) {
        throw new AppError({
          code: "PROVIDER_ERROR",
          message: "Verification code could not be generated. Please try again.",
        });
      }
      logger.info(
        {
          event: "auth.registration.email_payload_created",
          requestId: context.requestId,
          toEmail: generatedEmail.email,
          templateKey: AUTH_EMAIL_TEMPLATES.verifyEmail,
          otpPresent: true,
          actionLinkPresent: authEmail.actionLink.length > 0,
        },
        "Verification email payload created",
      );

      await this.deps.transactionManager.runInTransaction(async (tx) => {
        const appUser = await this.deps.identityRepository.ensureUser(tx, {
          authUserId: generatedEmail.authUserId,
          email: generatedEmail.email.toLowerCase(),
          emailVerifiedAt: null,
          status: "active",
        });

        await this.bootstrapper.bootstrap(tx, {
          userId: appUser.id,
          displayName: displayName ?? null,
          legalName: legalName ?? null,
          country: context.approximateLocation,
          stateRegion: context.approximateCity ?? context.approximateRegion,
        });

        const name = legalName ?? displayName ?? appUser.email.split("@")[0] ?? "Investor";

        const verificationMessage = await this.emailQueue.enqueue(tx, {
          recipientUserId: appUser.id,
          toEmail: appUser.email,
          templateKey: AUTH_EMAIL_TEMPLATES.verifyEmail,
          idempotencyKey: `auth.verify_email:${appUser.id}:${authEmail.hashedToken}`,
          metadata: {
            otp: authEmail.otp,
            actionLink: authEmail.actionLink,
            hashedToken: authEmail.hashedToken,
            name,
            displayName: displayName ?? null,
            trigger: "auth.register",
            requestId: context.requestId,
          },
        });
        logger.info(
          {
            event: "auth.registration.email_queued",
            requestId: context.requestId,
            emailMessageId: verificationMessage.id,
            toEmail: appUser.email,
            templateKey: AUTH_EMAIL_TEMPLATES.verifyEmail,
          },
          "Verification email queued",
        );

        await this.emailQueue.enqueue(tx, {
          recipientUserId: appUser.id,
          toEmail: appUser.email,
          templateKey: AUTH_EMAIL_TEMPLATES.welcome,
          idempotencyKey: `auth.welcome:${appUser.id}`,
          availableAt: new Date(Date.now() + SIGNUP_WELCOME_DELAY_MS),
          metadata: {
            name,
            displayName: displayName ?? null,
            actionLink: authEmail.actionLink,
            signupWelcome: true,
            trigger: "auth.register.welcome_delayed",
            requestId: context.requestId,
          },
        });

        await this.appendAudit(tx, appUser.id, "auth.registered", "user", appUser.id, context);
      });

      this.setPendingVerifyCookie(generatedEmail.email);

      return {
        email: generatedEmail.email,
        verificationRequired: true,
      };
    } catch (error) {
      if (authUserId && this.deps.identityProvider.adminDeleteUser) {
        try {
          await this.deps.identityProvider.adminDeleteUser(authUserId);
          logger.warn(
            {
              event: "auth.registration.auth_user_rolled_back",
              requestId: context.requestId,
              authUserId,
            },
            "Deleted Auth user after registration transaction failure",
          );
        } catch (cleanupError) {
          logger.error(
            {
              event: "auth.registration.auth_user_rollback_failed",
              requestId: context.requestId,
              authUserId,
              cause: cleanupError instanceof Error ? cleanupError.message : String(cleanupError),
              err: cleanupError,
            },
            "Failed to roll back Auth user after registration failure",
          );
        }
      }
      throw mapRegistrationProviderError(error);
    }
  }

  async checkAvailability(input: { email?: string; username?: string }) {
    const result: { emailAvailable?: boolean; usernameAvailable?: boolean } = {};

    if (input.email) {
      const existing = await this.deps.identityRepository.findUserByEmail(input.email);
      result.emailAvailable = !existing;
    }

    if (input.username) {
      const existing = await this.deps.coreRepository.findCustomerProfileByDisplayName(
        input.username,
      );
      result.usernameAvailable = !existing;
    }

    return result;
  }

  async resendVerification(input: ResendVerificationInput, context: RequestSecurityContext) {
    const rateLimit = this.deps.rateLimiter.checkOtp(input.email, context.ipAddress);
    if (!rateLimit.allowed) {
      throw new AppError({
        code: "RATE_LIMITED",
        message: "Too many verification emails. Try again later.",
        details: { retryAfterSeconds: rateLimit.retryAfterSeconds },
      });
    }

    const appUser = await this.deps.identityRepository.findUserByEmail(input.email);
    if (!appUser) {
      return { accepted: true };
    }

    if (appUser.emailVerifiedAt) {
      throw new AppError({
        code: "VALIDATION_ERROR",
        message: "Email is already verified. Please sign in.",
      });
    }

    const profile = await this.deps.coreRepository.findCustomerProfileByUserId(appUser.id);
    const name =
      profile?.legalName ?? profile?.displayName ?? appUser.email.split("@")[0] ?? "Investor";

    const appUrl = resolvePublicAppUrl(getServerEnv().NEXT_PUBLIC_APP_URL);
    const redirectTo = `${appUrl}${AUTH_ROUTES.verifyEmail}`;
    const generatedEmail = await this.deps.identityProvider.generateEmailVerificationLink({
      email: input.email,
      redirectTo,
    });
    const authEmail = buildAuthEmailAction({
      properties: {
        actionLink: generatedEmail.actionLink,
        hashedToken: generatedEmail.hashedToken,
        emailOtp: generatedEmail.emailOtp,
      },
      flow: "email",
      email: generatedEmail.email,
      appUrl,
    });
    if (!authEmail.otp) {
      throw new AppError({
        code: "PROVIDER_ERROR",
        message: "Verification code could not be generated. Please try again.",
      });
    }

    await this.deps.transactionManager.runInTransaction(async (tx) => {
      await this.emailQueue.enqueue(tx, {
        recipientUserId: appUser.id,
        toEmail: appUser.email,
        templateKey: AUTH_EMAIL_TEMPLATES.verifyEmail,
        idempotencyKey: `auth.verify_email_resend:${appUser.id}:${authEmail.hashedToken}`,
        metadata: {
          otp: authEmail.otp,
          actionLink: authEmail.actionLink,
          hashedToken: authEmail.hashedToken,
          name,
          displayName: profile?.displayName ?? null,
          trigger: "auth.resend_verification",
          requestId: context.requestId,
        },
      });
      await this.appendAudit(
        tx,
        appUser.id,
        "auth.verification_resent",
        "user",
        appUser.id,
        context,
      );
    });

    this.setPendingVerifyCookie(appUser.email);
    return { accepted: true, email: appUser.email };
  }

  async verifyEmail(input: VerifyEmailInput, context: RequestSecurityContext) {
    const authenticated = await this.deps.identityProvider.verifySignupOtp(
      input.email,
      input.token,
    );
    return this.completeEmailVerification(authenticated, context, { createSession: true });
  }

  async verifyEmailLink(input: VerifyEmailLinkInput, context: RequestSecurityContext) {
    let authenticated;
    if (input.tokenHash) {
      authenticated = await this.deps.identityProvider.verifyEmailTokenHash(
        input.tokenHash,
        input.type,
      );
    } else if (input.email && input.token) {
      authenticated = await this.deps.identityProvider.verifySignupOtp(input.email, input.token);
    } else {
      throw new AppError({
        code: "VALIDATION_ERROR",
        message: "A verification code or email link token is required.",
      });
    }

    const email = authenticated.user.email?.toLowerCase() ?? input.email?.toLowerCase() ?? "";
    const sameBrowser = this.hasPendingVerifyCookie(email);
    return this.completeEmailVerification(authenticated, context, {
      createSession: sameBrowser,
    });
  }

  private async completeEmailVerification(
    authenticated: { user: AuthenticatedUser; session: AuthenticatedSession },
    context: RequestSecurityContext,
    options: { createSession: boolean },
  ) {
    const appUser = await this.ensureVerifiedAppUser(authenticated.user, context);

    await this.deps.transactionManager.runInTransaction(async (tx) => {
      await this.deps.notificationRepository.suppressQueuedEmailByIdempotencyKey(
        tx,
        `auth.welcome:${appUser.id}`,
      );
      await this.emailQueue.enqueue(tx, {
        recipientUserId: appUser.id,
        toEmail: appUser.email,
        templateKey: AUTH_EMAIL_TEMPLATES.emailVerified,
        idempotencyKey: `auth.email_verified:${appUser.id}:${authenticated.user.emailVerifiedAt?.toISOString() ?? "verified"}`,
        metadata: {
          name: appUser.email.split("@")[0] ?? "Investor",
          trigger: "auth.email_verified",
          requestId: context.requestId,
        },
      });
    });

    this.clearPendingVerifyCookie();

    if (!options.createSession) {
      await this.deps.identityProvider.signOutCurrentSession();
      return {
        userId: appUser.id,
        email: appUser.email,
        sessionCreated: false as const,
        message: "Email verified successfully. Please sign in to continue.",
      };
    }

    await this.recordSessionAndDevice(appUser.id, appUser.email, authenticated.session, context);
    const redirectTo = await this.resolvePostLoginRedirect(appUser.id);
    return {
      userId: appUser.id,
      email: appUser.email,
      sessionCreated: true as const,
      redirectTo,
    };
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
      await this.backfillProfileLocationFromRequest(appUser.id, context);
      if (authenticated.user.mustChangePassword) {
        return {
          userId: appUser.id,
          email: appUser.email,
          redirectTo: "/auth/change-password" as const,
          mustChangePassword: true,
        };
      }
      const redirectTo = await this.resolvePostLoginRedirect(appUser.id);
      return { userId: appUser.id, email: appUser.email, redirectTo, mustChangePassword: false };
    } catch (error) {
      const failed = this.deps.rateLimiter.recordLoginFailure(input.email, context.ipAddress);

      if (!failed.allowed) {
        await this.queueAccountLockedEmail(input.email, failed.lockedUntil, context);
      }

      throw error;
    }
  }

  private async resolvePostLoginRedirect(
    userId: string,
  ): Promise<"/admin" | "/dashboard" | "/auth/change-password"> {
    const adminProfile = await this.deps.identityRepository.findAdminProfileByUserId(userId);
    if (!adminProfile || adminProfile.status !== "active") {
      return "/dashboard";
    }

    const roleKeys = await this.deps.identityRepository.listActiveRoleKeysForUser(userId);
    return roleKeys.length > 0 ? "/admin" : "/dashboard";
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

    const appUrl = resolvePublicAppUrl(getServerEnv().NEXT_PUBLIC_APP_URL);
    const redirectTo = `${appUrl}${AUTH_ROUTES.resetPassword}`;
    const generatedEmail = await this.deps.identityProvider.generatePasswordResetEmail({
      email: input.email,
      redirectTo,
    });

    if (generatedEmail) {
      const appUser = await this.deps.identityRepository.findUserByAuthUserId(
        generatedEmail.authUserId,
      );
      const profile = appUser
        ? await this.deps.coreRepository.findCustomerProfileByUserId(appUser.id)
        : null;
      const name =
        profile?.legalName ??
        profile?.displayName ??
        generatedEmail.email.split("@")[0] ??
        "Investor";
      const authEmail = buildAuthEmailAction({
        properties: {
          actionLink: generatedEmail.actionLink,
          hashedToken: generatedEmail.hashedToken,
          emailOtp: generatedEmail.emailOtp,
        },
        flow: "recovery",
        email: generatedEmail.email,
        appUrl,
      });
      if (!authEmail.otp) {
        throw new AppError({
          code: "PROVIDER_ERROR",
          message: "Password reset code could not be generated. Please try again.",
        });
      }

      await this.deps.transactionManager.runInTransaction(async (tx) => {
        await this.emailQueue.enqueue(tx, {
          recipientUserId: appUser?.id ?? null,
          toEmail: generatedEmail.email,
          templateKey: AUTH_EMAIL_TEMPLATES.passwordReset,
          idempotencyKey: `auth.password_reset:${generatedEmail.authUserId}:${authEmail.hashedToken}`,
          metadata: {
            otp: authEmail.otp,
            actionLink: authEmail.actionLink,
            hashedToken: authEmail.hashedToken,
            name,
            displayName: profile?.displayName ?? null,
            trigger: "auth.forgot_password",
            requestId: context.requestId,
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

  async verifyRecoveryOtp(input: VerifyRecoveryOtpInput, context: RequestSecurityContext) {
    const authenticated = input.tokenHash
      ? await this.deps.identityProvider.verifyRecoveryTokenHash(input.tokenHash)
      : await this.deps.identityProvider.verifyRecoveryOtp({
          email: input.email!,
          token: input.token!,
        });
    const email = authenticated.user.email?.toLowerCase() ?? input.email?.toLowerCase() ?? "";

    await this.deps.transactionManager.runInTransaction(async (tx) => {
      const appUser = await this.deps.identityRepository.findUserByAuthUserId(
        authenticated.user.authUserId,
      );
      if (appUser) {
        await this.appendAudit(
          tx,
          appUser.id,
          "auth.password_reset_otp_verified",
          "user",
          appUser.id,
          context,
        );
      }
    });

    return { verified: true as const, email };
  }

  async resetPassword(input: ResetPasswordInput, context: RequestSecurityContext) {
    let authenticated: { user: AuthenticatedUser; session: AuthenticatedSession };

    if (input.email && input.token) {
      authenticated = await this.deps.identityProvider.resetPasswordWithOtp({
        email: input.email,
        token: input.token,
        password: input.password,
      });
    } else {
      const user = await this.deps.identityProvider.getCurrentUser();
      const session = await this.deps.identityProvider.getCurrentSession();
      if (!user || !session) {
        throw new AppError({
          code: "AUTHENTICATION_ERROR",
          message: "Verify your reset code before choosing a new password.",
        });
      }
      await this.deps.identityProvider.changePassword(input.password);
      authenticated = { user, session };
    }

    const appUser = await this.ensureVerifiedAppUser(authenticated.user, context);

    await this.deps.transactionManager.runInTransaction(async (tx) => {
      await this.emailQueue.enqueue(tx, {
        recipientUserId: appUser.id,
        toEmail: appUser.email,
        templateKey: AUTH_EMAIL_TEMPLATES.passwordChanged,
        idempotencyKey: `auth.password_changed:${appUser.id}:${Date.now()}`,
        metadata: {
          trigger: "auth.password_reset",
          requestId: context.requestId,
        },
      });
      await this.appendAudit(tx, appUser.id, "auth.password_changed", "user", appUser.id, context);
    });

    await this.recordSessionAndDevice(appUser.id, appUser.email, authenticated.session, context);
    const redirectTo = await this.resolvePostLoginRedirect(appUser.id);

    return { userId: appUser.id, redirectTo };
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
    await this.deps.identityProvider.adminSetMustChangePassword?.(appUser.authUserId, false);

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

    const redirectTo = await this.resolvePostLoginRedirect(appUser.id);
    return { changed: true, redirectTo };
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

  /**
   * Persist coarse CDN location onto the customer profile when missing.
   * Enables privacy-safe social proof without fabricating geography.
   */
  private async backfillProfileLocationFromRequest(
    userId: string,
    context: RequestSecurityContext,
  ) {
    const country = normalizeIsoCountry(context.approximateLocation);
    const stateRegion = normalizeRegionLabel(context.approximateCity ?? context.approximateRegion);
    if (!country && !stateRegion) return;

    const profile = await this.deps.coreRepository.findCustomerProfileByUserId(userId);
    if (!profile) return;

    const nextCountry = profile.country ?? country;
    const nextStateRegion = profile.stateRegion ?? stateRegion;
    if (nextCountry === profile.country && nextStateRegion === profile.stateRegion) return;

    await this.deps.transactionManager.runInTransaction(async (tx) => {
      await this.deps.coreRepository.updateCustomerProfile(tx, userId, {
        ...(nextCountry !== profile.country ? { country: nextCountry } : {}),
        ...(nextStateRegion !== profile.stateRegion ? { stateRegion: nextStateRegion } : {}),
      });
    });
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
        country: context.approximateLocation,
        stateRegion: context.approximateCity ?? context.approximateRegion,
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
    const fingerprint = parseDeviceFingerprint(context.userAgent);

    // Trusted device token hashes are globally unique. Never reuse a cookie token
    // that does not already belong to this user — that causes unique_violation and
    // aborts login/verify after the account is already verified.
    let deviceToken = createTrustedDeviceToken();
    let deviceTokenHash = hashTrustedDeviceToken(deviceToken);
    let knownDevice = null as Awaited<
      ReturnType<IdentityRepository["findTrustedDeviceByTokenHash"]>
    >;

    const existingDeviceToken = this.deps.cookies.get(AUTH_COOKIE_NAMES.trustedDevice);
    if (existingDeviceToken) {
      const existingHash = hashTrustedDeviceToken(existingDeviceToken);
      const ownedDevice = await this.deps.identityRepository.findTrustedDeviceByTokenHash(
        appUserId,
        existingHash,
      );
      if (ownedDevice) {
        deviceToken = existingDeviceToken;
        deviceTokenHash = existingHash;
        knownDevice = ownedDevice;
      }
    }

    // Cookie alone is not enough — browser/OS changes are treated as a new device.
    if (knownDevice && knownDevice.label && knownDevice.label !== fingerprint.label) {
      knownDevice = null;
      deviceToken = createTrustedDeviceToken();
      deviceTokenHash = hashTrustedDeviceToken(deviceToken);
    }

    const deviceExpiresAt = trustedDeviceExpiresAt(now);

    await this.deps.transactionManager.runInTransaction(async (tx) => {
      let trustedDeviceId = knownDevice?.id;

      if (knownDevice) {
        await this.deps.identityRepository.touchTrustedDevice(tx, knownDevice.id, now);
      } else {
        const device = await this.deps.identityRepository.createTrustedDevice(tx, {
          userId: appUserId,
          deviceTokenHash,
          label: fingerprint.label,
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
            deviceLabel: fingerprint.label,
            browser: fingerprint.browser,
            os: fingerprint.os,
            signedInAt: now.toISOString(),
            ipAddressMasked: maskIpAddress(context.ipAddress),
            approximateLocation: context.approximateLocation,
            ipAddressSeen: Boolean(context.ipAddress),
            trigger: "new_device_login",
            requestId: context.requestId,
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

  private setPendingVerifyCookie(email: string) {
    this.deps.cookies.set(
      AUTH_COOKIE_NAMES.pendingVerify,
      sha256(`pending-verify:${email.toLowerCase()}`),
      {
        httpOnly: true,
        secure: getServerEnv().NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: PENDING_VERIFY_TTL_SECONDS,
      },
    );
  }

  private hasPendingVerifyCookie(email: string): boolean {
    if (!email) return false;
    const expected = sha256(`pending-verify:${email.toLowerCase()}`);
    const actual = this.deps.cookies.get(AUTH_COOKIE_NAMES.pendingVerify);
    return Boolean(actual && actual === expected);
  }

  private clearPendingVerifyCookie() {
    this.deps.cookies.delete(AUTH_COOKIE_NAMES.pendingVerify);
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

function mapRegistrationProviderError(error: unknown): unknown {
  if (isAppError(error)) {
    const message = error.message.toLowerCase();
    if (
      message.includes("already registered") ||
      message.includes("already been registered") ||
      message.includes("user already exists") ||
      message.includes("email address has already been registered")
    ) {
      return new AppError({
        code: "VALIDATION_ERROR",
        message: "This email address is already registered.",
        cause: error,
      });
    }
    if (message.includes("username") && message.includes("taken")) {
      return new AppError({
        code: "VALIDATION_ERROR",
        message: "This username is already taken.",
        cause: error,
      });
    }
    return error;
  }

  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  if (
    message.includes("already registered") ||
    message.includes("user already exists") ||
    (message.includes("duplicate key") && message.includes("email"))
  ) {
    return new AppError({
      code: "VALIDATION_ERROR",
      message: "This email address is already registered.",
      cause: error,
    });
  }

  return error;
}
