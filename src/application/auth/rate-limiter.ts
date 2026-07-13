import "server-only";

import {
  AUTH_LOGIN_LOCKOUT_MS,
  AUTH_LOGIN_LOCKOUT_THRESHOLD,
  AUTH_RATE_LIMIT_WINDOW_MS,
} from "./constants";

export interface RateLimitCheck {
  allowed: boolean;
  retryAfterSeconds?: number;
  lockedUntil?: Date;
}

export interface AuthenticationRateLimiter {
  checkLogin(email: string, ipAddress: string | null): RateLimitCheck;
  recordLoginFailure(email: string, ipAddress: string | null): RateLimitCheck;
  recordLoginSuccess(email: string, ipAddress: string | null): void;
  checkOtp(email: string, ipAddress: string | null): RateLimitCheck;
  checkPasswordReset(email: string, ipAddress: string | null): RateLimitCheck;
}

interface Bucket {
  count: number;
  resetAt: number;
  lockedUntil?: number;
}

function bucketKey(scope: string, email: string, ipAddress: string | null) {
  return `${scope}:${email}:${ipAddress ?? "unknown"}`;
}

function toRetryAfter(targetMs: number) {
  return Math.max(1, Math.ceil((targetMs - Date.now()) / 1000));
}

export class MemoryAuthenticationRateLimiter implements AuthenticationRateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  checkLogin(email: string, ipAddress: string | null): RateLimitCheck {
    const bucket = this.getBucket(bucketKey("login", email, ipAddress));

    if (bucket.lockedUntil && bucket.lockedUntil > Date.now()) {
      return {
        allowed: false,
        retryAfterSeconds: toRetryAfter(bucket.lockedUntil),
        lockedUntil: new Date(bucket.lockedUntil),
      };
    }

    return { allowed: true };
  }

  recordLoginFailure(email: string, ipAddress: string | null): RateLimitCheck {
    const bucket = this.getBucket(bucketKey("login", email, ipAddress));
    bucket.count += 1;

    if (bucket.count >= AUTH_LOGIN_LOCKOUT_THRESHOLD) {
      bucket.lockedUntil = Date.now() + AUTH_LOGIN_LOCKOUT_MS;
      return {
        allowed: false,
        retryAfterSeconds: toRetryAfter(bucket.lockedUntil),
        lockedUntil: new Date(bucket.lockedUntil),
      };
    }

    return { allowed: true };
  }

  recordLoginSuccess(email: string, ipAddress: string | null): void {
    this.buckets.delete(bucketKey("login", email, ipAddress));
  }

  checkOtp(email: string, ipAddress: string | null): RateLimitCheck {
    return this.checkFixedWindow(bucketKey("otp", email, ipAddress), 10);
  }

  checkPasswordReset(email: string, ipAddress: string | null): RateLimitCheck {
    return this.checkFixedWindow(bucketKey("password-reset", email, ipAddress), 5);
  }

  private checkFixedWindow(key: string, limit: number): RateLimitCheck {
    const bucket = this.getBucket(key);
    bucket.count += 1;

    if (bucket.count > limit) {
      return {
        allowed: false,
        retryAfterSeconds: toRetryAfter(bucket.resetAt),
      };
    }

    return { allowed: true };
  }

  private getBucket(key: string): Bucket {
    const now = Date.now();
    const existing = this.buckets.get(key);

    if (existing && existing.resetAt > now) {
      return existing;
    }

    const nextBucket = {
      count: 0,
      resetAt: now + AUTH_RATE_LIMIT_WINDOW_MS,
    };
    this.buckets.set(key, nextBucket);
    return nextBucket;
  }
}

export const authenticationRateLimiter = new MemoryAuthenticationRateLimiter();
