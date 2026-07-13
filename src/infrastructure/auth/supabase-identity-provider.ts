import "server-only";

import type { Session, SupabaseClient, User } from "@supabase/supabase-js";

import { AppError } from "@/application/errors";
import type {
  AuthenticatedIdentity,
  AuthenticatedSession,
  AuthenticatedUser,
  GeneratedAuthEmail,
  GeneratePasswordResetEmailInput,
  GenerateSignupEmailInput,
  IdentityProvider,
  ResetPasswordWithOtpInput,
} from "@/application/auth/identity-provider";

export class SupabaseIdentityProvider implements IdentityProvider {
  constructor(
    private readonly adminClient: SupabaseClient,
    private readonly routeClient: SupabaseClient,
  ) {}

  async generateSignupEmail(input: GenerateSignupEmailInput): Promise<GeneratedAuthEmail> {
    const { data, error } = await this.adminClient.auth.admin.generateLink({
      type: "signup",
      email: input.email,
      password: input.password,
      options: {
        redirectTo: input.redirectTo,
        data: {
          displayName: input.displayName ?? null,
        },
      },
    });

    if (error) {
      throw new AppError({
        code: "PROVIDER_ERROR",
        message: error.message,
        details: { provider: "supabase", operation: "generateSignupEmail" },
      });
    }

    return toGeneratedAuthEmail(data.user, data.properties, input.email);
  }

  async generatePasswordResetEmail(
    input: GeneratePasswordResetEmailInput,
  ): Promise<GeneratedAuthEmail | null> {
    const { data, error } = await this.adminClient.auth.admin.generateLink({
      type: "recovery",
      email: input.email,
      options: {
        redirectTo: input.redirectTo,
      },
    });

    if (error) {
      if (error.message.toLowerCase().includes("not found")) {
        return null;
      }

      throw new AppError({
        code: "PROVIDER_ERROR",
        message: error.message,
        details: { provider: "supabase", operation: "generatePasswordResetEmail" },
      });
    }

    return toGeneratedAuthEmail(data.user, data.properties, input.email);
  }

  async verifySignupOtp(email: string, token: string): Promise<AuthenticatedIdentity> {
    const { data, error } = await this.routeClient.auth.verifyOtp({
      email,
      token,
      type: "signup",
    });

    if (error || !data.user || !data.session) {
      throw new AppError({
        code: "AUTHENTICATION_ERROR",
        message: error?.message ?? "Email verification failed.",
      });
    }

    return toAuthenticatedIdentity(data.user, data.session);
  }

  async signInWithPassword(email: string, password: string): Promise<AuthenticatedIdentity> {
    const { data, error } = await this.routeClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user || !data.session) {
      throw new AppError({
        code: "AUTHENTICATION_ERROR",
        message: error?.message ?? "Login failed.",
      });
    }

    return toAuthenticatedIdentity(data.user, data.session);
  }

  async resetPasswordWithOtp(input: ResetPasswordWithOtpInput): Promise<AuthenticatedIdentity> {
    const { data, error } = await this.routeClient.auth.verifyOtp({
      email: input.email,
      token: input.token,
      type: "recovery",
    });

    if (error || !data.user || !data.session) {
      throw new AppError({
        code: "AUTHENTICATION_ERROR",
        message: error?.message ?? "Password reset verification failed.",
      });
    }

    const updateResult = await this.routeClient.auth.updateUser({
      password: input.password,
    });

    if (updateResult.error) {
      throw new AppError({
        code: "PROVIDER_ERROR",
        message: updateResult.error.message,
        details: { provider: "supabase", operation: "updateRecoveredPassword" },
      });
    }

    return toAuthenticatedIdentity(data.user, data.session);
  }

  async changePassword(newPassword: string): Promise<void> {
    const { error } = await this.routeClient.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw new AppError({
        code: "PROVIDER_ERROR",
        message: error.message,
        details: { provider: "supabase", operation: "changePassword" },
      });
    }
  }

  async getCurrentUser(): Promise<AuthenticatedUser | null> {
    const { data, error } = await this.routeClient.auth.getUser();

    if (error || !data.user) {
      return null;
    }

    return toAuthenticatedUser(data.user);
  }

  async getCurrentSession(): Promise<AuthenticatedSession | null> {
    const { data, error } = await this.routeClient.auth.getSession();

    if (error || !data.session) {
      return null;
    }

    return toAuthenticatedSession(data.session);
  }

  async refreshSession(): Promise<AuthenticatedIdentity> {
    const { data, error } = await this.routeClient.auth.refreshSession();

    if (error || !data.user || !data.session) {
      throw new AppError({
        code: "AUTHENTICATION_ERROR",
        message: error?.message ?? "Session refresh failed.",
      });
    }

    return toAuthenticatedIdentity(data.user, data.session);
  }

  async signOutCurrentSession(): Promise<void> {
    const { error } = await this.routeClient.auth.signOut({ scope: "local" });

    if (error) {
      throw new AppError({
        code: "PROVIDER_ERROR",
        message: error.message,
        details: { provider: "supabase", operation: "signOutCurrentSession" },
      });
    }
  }

  async signOutOtherSessions(accessToken: string): Promise<void> {
    const { error } = await this.adminClient.auth.admin.signOut(accessToken, "others");

    if (error) {
      throw new AppError({
        code: "PROVIDER_ERROR",
        message: error.message,
        details: { provider: "supabase", operation: "signOutOtherSessions" },
      });
    }
  }
}

function toAuthenticatedIdentity(user: User, session: Session): AuthenticatedIdentity {
  return {
    user: toAuthenticatedUser(user),
    session: toAuthenticatedSession(session),
  };
}

function toAuthenticatedUser(user: User): AuthenticatedUser {
  return {
    authUserId: user.id,
    email: user.email ?? null,
    emailVerifiedAt: user.email_confirmed_at ? new Date(user.email_confirmed_at) : null,
    displayName:
      typeof user.user_metadata.displayName === "string" ? user.user_metadata.displayName : null,
  };
}

function toAuthenticatedSession(session: Session): AuthenticatedSession {
  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: session.expires_at
      ? new Date(session.expires_at * 1000)
      : new Date(Date.now() + 60 * 60 * 1000),
  };
}

function toGeneratedAuthEmail(
  user: User,
  properties: {
    action_link: string;
    email_otp: string;
    hashed_token: string;
  },
  fallbackEmail: string,
): GeneratedAuthEmail {
  return {
    authUserId: user.id,
    email: user.email ?? fallbackEmail,
    actionLink: properties.action_link,
    emailOtp: properties.email_otp,
    hashedToken: properties.hashed_token,
  };
}
