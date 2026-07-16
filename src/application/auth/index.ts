export { AUTH_COOKIE_NAMES, AUTH_EMAIL_TEMPLATES, AUTH_ROUTES } from "./constants";
export { IdentityAuthService } from "./identity-auth-service";
export { IdentityEmailQueue } from "./identity-email-queue";
export {
  OTP_MAX_LENGTH,
  OTP_MIN_LENGTH,
  displayOtp,
  isValidOtp,
  normalizeOtpToken,
  sanitizeOtpInput,
} from "./otp";
export { CustomerIdentityBootstrapService } from "./profile-bootstrap";
export { authenticationRateLimiter, MemoryAuthenticationRateLimiter } from "./rate-limiter";
export {
  changePasswordInputSchema,
  forgotPasswordInputSchema,
  loginInputSchema,
  registerInputSchema,
  resendVerificationInputSchema,
  resetPasswordInputSchema,
  revokeSessionInputSchema,
  revokeTrustedDeviceInputSchema,
  availabilityQuerySchema,
  verifyEmailInputSchema,
  verifyEmailLinkInputSchema,
} from "./schemas";
export type {
  AuthenticatedIdentity,
  AuthenticatedSession,
  AuthenticatedUser,
  GeneratedAuthEmail,
  IdentityProvider,
} from "./identity-provider";
export type {
  AvailabilityQuery,
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResendVerificationInput,
  ResetPasswordInput,
  VerifyEmailInput,
  VerifyEmailLinkInput,
} from "./schemas";
