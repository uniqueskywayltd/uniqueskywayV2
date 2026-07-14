import { AUTH_COOKIE_NAMES } from "@/application/auth";

/** Dev/local fallback — `__Host-` cookies are rejected without the Secure flag. */
export const CSRF_COOKIE_LOCAL = "usw-csrf";

export type CsrfCookieDescriptor = {
  name: string;
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: "/";
};

/**
 * Resolve CSRF cookie flags without bypassing protection.
 *
 * `__Host-usw-csrf` requires `Secure` + `Path=/` and no Domain.
 * Local HTTP (incl. 127.0.0.1) cannot set `__Host-` cookies — use `usw-csrf`.
 * Production / HTTPS uses the certified `__Host-` name with Secure.
 */
export function resolveCsrfCookie(): CsrfCookieDescriptor {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const useHostPrefix =
    process.env.NODE_ENV === "production" || appUrl.startsWith("https://");

  if (useHostPrefix) {
    return {
      name: AUTH_COOKIE_NAMES.csrf,
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
    };
  }

  return {
    name: CSRF_COOKIE_LOCAL,
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
  };
}

export function csrfCookieNames(): readonly string[] {
  return [AUTH_COOKIE_NAMES.csrf, CSRF_COOKIE_LOCAL];
}
