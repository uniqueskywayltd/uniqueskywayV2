/** Canonical platform email identity for all transactional and support mail. */

export const PLATFORM_SUPPORT_EMAIL = "info@uniqueskyway.com";
export const PLATFORM_EMAIL_DISPLAY_NAME = "Unique Sky Way";
export const PLATFORM_FROM_ADDRESS = `${PLATFORM_EMAIL_DISPLAY_NAME} <${PLATFORM_SUPPORT_EMAIL}>`;

const EMAIL_IN_ANGLE = /^(.+?)\s*<([^>]+)>$/;

/** Resend tag values may only contain ASCII letters, numbers, underscores, or dashes. */
export function sanitizeResendTagValue(value: string): string {
  return value
    .replace(/[^A-Za-z0-9_-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 256);
}

export function extractEmailAddress(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const angled = trimmed.match(EMAIL_IN_ANGLE);
  if (angled?.[2]) {
    return angled[2].trim().toLowerCase();
  }
  return trimmed.toLowerCase();
}

/** Accepts bare emails or `Name <email>` and normalizes to the display form. */
export function resolveResendFromAddress(raw: string | undefined): string {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) {
    return PLATFORM_FROM_ADDRESS;
  }

  const angled = trimmed.match(EMAIL_IN_ANGLE);
  if (angled?.[1] && angled[2]) {
    const email = angled[2].trim().toLowerCase();
    const name = angled[1].trim() || PLATFORM_EMAIL_DISPLAY_NAME;
    if (isValidEmail(email)) {
      return `${name} <${email}>`;
    }
  }

  if (isValidEmail(trimmed)) {
    return `${PLATFORM_EMAIL_DISPLAY_NAME} <${trimmed.toLowerCase()}>`;
  }

  return PLATFORM_FROM_ADDRESS;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
