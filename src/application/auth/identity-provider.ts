import "server-only";

export interface GeneratedAuthEmail {
  authUserId: string;
  email: string;
  actionLink: string;
  emailOtp: string;
  hashedToken: string;
}

export interface AuthenticatedUser {
  authUserId: string;
  email: string | null;
  emailVerifiedAt: Date | null;
  displayName: string | null;
  mustChangePassword: boolean;
}

export interface AuthenticatedSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface AuthenticatedIdentity {
  user: AuthenticatedUser;
  session: AuthenticatedSession;
}

export interface GenerateSignupEmailInput {
  email: string;
  password: string;
  redirectTo: string;
  displayName?: string;
}

export interface GeneratePasswordResetEmailInput {
  email: string;
  redirectTo: string;
}

export interface ResetPasswordWithOtpInput {
  email: string;
  token: string;
  password: string;
}

export interface VerifyRecoveryOtpInput {
  email: string;
  token: string;
}

export interface AdminCreateUserInput {
  email: string;
  password: string;
  displayName?: string;
  emailConfirmed?: boolean;
  mustChangePassword?: boolean;
}

export interface AdminCreatedUser {
  authUserId: string;
  email: string;
}

export interface IdentityProvider {
  generateSignupEmail(input: GenerateSignupEmailInput): Promise<GeneratedAuthEmail>;
  generateEmailVerificationLink(input: {
    email: string;
    redirectTo: string;
  }): Promise<GeneratedAuthEmail>;
  generatePasswordResetEmail(
    input: GeneratePasswordResetEmailInput,
  ): Promise<GeneratedAuthEmail | null>;
  adminCreateUser?(input: AdminCreateUserInput): Promise<AdminCreatedUser>;
  adminDeleteUser?(authUserId: string): Promise<void>;
  adminUpdatePassword?(authUserId: string, password: string): Promise<void>;
  adminSetMustChangePassword?(authUserId: string, mustChangePassword: boolean): Promise<void>;
  verifySignupOtp(email: string, token: string): Promise<AuthenticatedIdentity>;
  verifyEmailTokenHash(
    tokenHash: string,
    type: "signup" | "email" | "magiclink",
  ): Promise<AuthenticatedIdentity>;
  signInWithPassword(email: string, password: string): Promise<AuthenticatedIdentity>;
  verifyRecoveryOtp(input: VerifyRecoveryOtpInput): Promise<AuthenticatedIdentity>;
  verifyRecoveryTokenHash(tokenHash: string): Promise<AuthenticatedIdentity>;
  resetPasswordWithOtp(input: ResetPasswordWithOtpInput): Promise<AuthenticatedIdentity>;
  changePassword(newPassword: string): Promise<void>;
  getCurrentUser(): Promise<AuthenticatedUser | null>;
  getCurrentSession(): Promise<AuthenticatedSession | null>;
  refreshSession(): Promise<AuthenticatedIdentity>;
  signOutCurrentSession(): Promise<void>;
  signOutOtherSessions(accessToken: string): Promise<void>;
}
