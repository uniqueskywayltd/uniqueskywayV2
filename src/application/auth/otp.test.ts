import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  OTP_MAX_LENGTH,
  OTP_MIN_LENGTH,
  displayOtp,
  isValidOtp,
  sanitizeOtpInput,
} from "@/application/auth/otp";
import {
  isNonProductionRedirect,
  resolvePublicAppUrl,
  sanitizeAuthActionLink,
} from "@/config/public-app-url";

describe("otp source of truth", () => {
  it("accepts 6–8 digit codes and rejects other lengths", () => {
    expect(OTP_MIN_LENGTH).toBe(6);
    expect(OTP_MAX_LENGTH).toBe(8);
    expect(isValidOtp("123456")).toBe(true);
    expect(isValidOtp("12345678")).toBe(true);
    expect(isValidOtp("12345")).toBe(false);
    expect(isValidOtp("123456789")).toBe(false);
    expect(sanitizeOtpInput("12ab3456789")).toBe("12345678");
    expect(displayOtp("32973644")).toBe("32973644");
  });
});

describe("public app url", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rewrites localhost action links to the production redirect", () => {
    const sanitized = sanitizeAuthActionLink(
      "https://lngjjttkiuqlclalccah.supabase.co/auth/v1/verify?token=abc&type=signup&redirect_to=http%3A%2F%2Flocalhost%3A3000",
      "https://uniqueskyway-v2.vercel.app/auth/verify-email",
    );
    expect(sanitized).toContain(
      "redirect_to=https%3A%2F%2Funiqueskyway-v2.vercel.app%2Fauth%2Fverify-email",
    );
    expect(sanitized).not.toContain("localhost");
  });

  it("treats localhost as non-production", () => {
    expect(isNonProductionRedirect("http://localhost:3000/auth/verify-email")).toBe(true);
    expect(isNonProductionRedirect("https://uniqueskyway-v2.vercel.app/auth/verify-email")).toBe(
      false,
    );
  });

  it("falls back to production URL when configured value is localhost in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(resolvePublicAppUrl("http://localhost:3000")).toBe("https://uniqueskyway-v2.vercel.app");
  });
});
