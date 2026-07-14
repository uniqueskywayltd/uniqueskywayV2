import { afterEach, describe, expect, it, vi } from "vitest";

import { AUTH_COOKIE_NAMES } from "@/application/auth";

import { CSRF_COOKIE_LOCAL, resolveCsrfCookie } from "./csrf-cookie";

describe("resolveCsrfCookie", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses a non-Host cookie without Secure for local HTTP development", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://127.0.0.1:3000");

    const cookie = resolveCsrfCookie();
    expect(cookie.name).toBe(CSRF_COOKIE_LOCAL);
    expect(cookie.secure).toBe(false);
    expect(cookie.path).toBe("/");
    expect(cookie.sameSite).toBe("lax");
    expect(cookie.httpOnly).toBe(true);
  });

  it("uses the certified __Host- cookie with Secure in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://uniqueskyway.com/v2");

    const cookie = resolveCsrfCookie();
    expect(cookie.name).toBe(AUTH_COOKIE_NAMES.csrf);
    expect(cookie.secure).toBe(true);
    expect(cookie.path).toBe("/");
  });

  it("uses the Host cookie when APP_URL is HTTPS even outside production", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://preview.example.com");

    const cookie = resolveCsrfCookie();
    expect(cookie.name).toBe(AUTH_COOKIE_NAMES.csrf);
    expect(cookie.secure).toBe(true);
  });
});
