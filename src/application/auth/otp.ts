/**
 * Single source of truth for email OTP format.
 * Matches Supabase Auth mailer OTP length (project may be 6–8 digits).
 * UI, API validation, and emails must all use these helpers — never hardcode length.
 */
export const OTP_MIN_LENGTH = 6;
export const OTP_MAX_LENGTH = 8;

export function normalizeOtpToken(value: string): string {
  return value.replace(/\D/g, "");
}

export function sanitizeOtpInput(value: string): string {
  return normalizeOtpToken(value).slice(0, OTP_MAX_LENGTH);
}

export function isValidOtp(value: string): boolean {
  const digits = normalizeOtpToken(value);
  return digits.length >= OTP_MIN_LENGTH && digits.length <= OTP_MAX_LENGTH;
}

/** Show the exact digits the identity provider issued — never truncate. */
export function displayOtp(otp: string | null | undefined): string | null {
  if (!otp) return null;
  const digits = normalizeOtpToken(otp);
  return digits || null;
}
