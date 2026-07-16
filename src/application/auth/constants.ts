export const AUTH_ROUTES = {
  login: "/auth/login",
  register: "/auth/register",
  verifyEmail: "/auth/verify-email",
  forgotPassword: "/auth/forgot-password",
  resetPassword: "/auth/reset-password",
  changePassword: "/auth/change-password",
  trustedDevices: "/account/security/trusted-devices",
  sessions: "/account/security/sessions",
} as const;

export const AUTH_EMAIL_TEMPLATES = {
  welcome: "auth.welcome",
  verifyEmail: "auth.verify_email",
  emailVerified: "auth.email_verified",
  passwordReset: "auth.password_reset",
  passwordChanged: "auth.password_changed",
  newDeviceSignIn: "auth.new_device_sign_in",
  accountLocked: "auth.account_locked",
  accountUnlocked: "auth.account_unlocked",
} as const;

export const AUTH_COOKIE_NAMES = {
  csrf: "__Host-usw-csrf",
  trustedDevice: "__Host-usw-device",
  /** Short-lived marker that registration started in this browser (email hash). */
  pendingVerify: "__Host-usw-pending-verify",
} as const;

export const PENDING_VERIFY_TTL_SECONDS = 60 * 60;

/** Delayed signup welcome (verify nudge) — sent after this delay if still unverified. */
export const SIGNUP_WELCOME_DELAY_MS = 35 * 60 * 1000;

export const TRUSTED_DEVICE_TTL_DAYS = 180;
export const AUTH_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
export const AUTH_LOGIN_LOCKOUT_THRESHOLD = 5;
export const AUTH_LOGIN_LOCKOUT_MS = 15 * 60 * 1000;
