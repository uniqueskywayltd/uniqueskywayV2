import { PLATFORM_SUPPORT_EMAIL } from "@/config/email-identity";

const PRODUCTION_HOSTS = new Set([
  "uniqueskyway-v2.vercel.app",
  "uniqueskyway-v2-unique-sky-way.vercel.app",
  "uniqueskyway.com",
  "www.uniqueskyway.com",
]);

/**
 * Canonical public origin for auth redirects and email links.
 * Never returns localhost when NODE_ENV is production.
 */
export function resolvePublicAppUrl(
  configured: string | undefined = process.env.NEXT_PUBLIC_APP_URL,
): string {
  const fallbackProduction = "https://uniqueskyway-v2.vercel.app";
  const trimmed = (configured ?? "").trim();

  if (trimmed) {
    try {
      const url = new URL(trimmed);
      if (isLocalHostname(url.hostname) && process.env.NODE_ENV === "production") {
        return fallbackProduction;
      }
      const path = url.pathname.replace(/\/$/, "");
      return path && path !== "/" ? `${url.origin}${path}` : url.origin;
    } catch {
      // fall through
    }
  }

  if (process.env.NODE_ENV === "production") {
    return fallbackProduction;
  }

  return "http://localhost:3000";
}

function isLocalHostname(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0" ||
    hostname === "[::1]"
  );
}

export function isNonProductionRedirect(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (isLocalHostname(parsed.hostname)) return true;
    if (PRODUCTION_HOSTS.has(parsed.hostname)) return false;
    // Ephemeral Vercel preview deployments
    if (/\.vercel\.app$/i.test(parsed.hostname)) return true;
    return false;
  } catch {
    return true;
  }
}

/**
 * Rewrite Supabase action-link redirect_to away from localhost/preview
 * so verification emails always land on the production app.
 */
export function sanitizeAuthActionLink(actionLink: string, redirectTo: string): string {
  try {
    const url = new URL(actionLink);
    const current = url.searchParams.get("redirect_to");
    if (!current || isNonProductionRedirect(current)) {
      url.searchParams.set("redirect_to", redirectTo);
    }
    return url.toString();
  } catch {
    return actionLink;
  }
}

export function buildAuthRedirectUrl(path: string): string {
  const base = resolvePublicAppUrl();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

export function getEmailBrand() {
  const appUrl = resolvePublicAppUrl();
  return {
    name: "Unique Sky Way",
    tagline: "Secure Investor Platform",
    supportEmail: PLATFORM_SUPPORT_EMAIL,
    appUrl,
    /** Production CDN logo — matches email-previews and works in all email clients. */
    logoUrl: "https://uniqueskyway.com/brand/dark-logo.webp",
    loginUrl: `${appUrl}/auth/login`,
  };
}
