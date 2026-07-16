import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  OTP_MAX_LENGTH,
  OTP_MIN_LENGTH,
  displayOtp,
  isValidOtp,
  sanitizeOtpInput,
} from "@/application/auth/otp";
import { buildAuthEmailAction, buildAppAuthActionUrl } from "@/application/auth/auth-email-links";
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

describe("branded auth email links", () => {
  it("builds on-domain verify URLs with token_hash and includes OTP", () => {
    const built = buildAuthEmailAction({
      properties: {
        action_link:
          "https://lngjjttkiuqlclalccah.supabase.co/auth/v1/verify?token=hashedtoken123&type=signup",
        hashed_token: "hashedtoken123",
        email_otp: "48291367",
      },
      flow: "signup",
      email: "investor@example.com",
      appUrl: "https://uniqueskyway-v2.vercel.app",
    });

    expect(built.otp).toBe("48291367");
    expect(built.actionLink).toBe(
      buildAppAuthActionUrl({
        tokenHash: "hashedtoken123",
        flow: "signup",
        email: "investor@example.com",
        appUrl: "https://uniqueskyway-v2.vercel.app",
      }),
    );
    expect(built.actionLink).toContain("/auth/verify-email");
    expect(built.actionLink).toContain("token_hash=hashedtoken123");
    expect(built.actionLink).not.toContain("supabase.co");
  });
});
