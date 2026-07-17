import { PLATFORM_SUPPORT_EMAIL } from "@/config/email-identity";
import { resolvePublicAppUrl } from "@/config/public-app-url";

/** Stable CDN logo used in production email HTML (email clients cache this host). */
export const EMAIL_LOGO_CDN_URL = "https://uniqueskyway.com/brand/dark-logo.webp";

const PRODUCTION_APP_URL = "https://uniqueskyway.com";
const MARKETING_SITE_URL = "https://uniqueskyway.com";

function isLocalUrl(value: string): boolean {
  try {
    const hostname = new URL(value).hostname;
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname === "[::1]"
    );
  } catch {
    return true;
  }
}

/**
 * Brand identity for transactional emails.
 * App links never resolve to localhost/preview — production only.
 */
export function getBrand() {
  const resolved = resolvePublicAppUrl();
  const appUrl = isLocalUrl(resolved) ? PRODUCTION_APP_URL : resolved;
  return {
    name: "Unique Sky Way",
    tagline: "Secure Investor Platform",
    email: PLATFORM_SUPPORT_EMAIL,
    url: appUrl,
    marketingUrl: MARKETING_SITE_URL,
    logoUrl: EMAIL_LOGO_CDN_URL,
    iconUrl: `${MARKETING_SITE_URL}/brand/icon.webp`,
  };
}

/** @deprecated Prefer getBrand() so URLs stay production-safe at render time. */
export const brand = getBrand();
