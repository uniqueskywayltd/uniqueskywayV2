import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AUTH_LOGIN_LOCKOUT_THRESHOLD } from "./constants";
import { MemoryAuthenticationRateLimiter } from "./rate-limiter";

describe("MemoryAuthenticationRateLimiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-12T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("locks login attempts after repeated failures and clears them on success", () => {
    const limiter = new MemoryAuthenticationRateLimiter();

    for (let attempt = 1; attempt < AUTH_LOGIN_LOCKOUT_THRESHOLD; attempt += 1) {
      expect(limiter.recordLoginFailure("investor@example.com", "203.0.113.10").allowed).toBe(true);
    }

    const locked = limiter.recordLoginFailure("investor@example.com", "203.0.113.10");

    expect(locked.allowed).toBe(false);
    expect(locked.retryAfterSeconds).toBeGreaterThan(0);
    expect(limiter.checkLogin("investor@example.com", "203.0.113.10").allowed).toBe(false);

    limiter.recordLoginSuccess("investor@example.com", "203.0.113.10");

    expect(limiter.checkLogin("investor@example.com", "203.0.113.10").allowed).toBe(true);
  });

  it("tracks fixed-window OTP and password-reset limits independently", () => {
    const limiter = new MemoryAuthenticationRateLimiter();

    for (let attempt = 0; attempt < 10; attempt += 1) {
      expect(limiter.checkOtp("investor@example.com", null).allowed).toBe(true);
    }
    expect(limiter.checkOtp("investor@example.com", null).allowed).toBe(false);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      expect(limiter.checkPasswordReset("investor@example.com", null).allowed).toBe(true);
    }
    expect(limiter.checkPasswordReset("investor@example.com", null).allowed).toBe(false);
  });
});
