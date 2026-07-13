import { describe, expect, it } from "vitest";

import { AUTH_COOKIE_NAMES, TRUSTED_DEVICE_TTL_DAYS } from "./constants";
import {
  createDeviceLabel,
  createOpaqueToken,
  getTrustedDeviceCookieName,
  hashIpAddress,
  hashSessionToken,
  hashTrustedDeviceToken,
  hashUserAgent,
  safeCompare,
  trustedDeviceExpiresAt,
} from "./security";

describe("authentication security helpers", () => {
  it("hashes sensitive identifiers with separate namespaces", () => {
    expect(hashTrustedDeviceToken("token")).not.toBe("token");
    expect(hashTrustedDeviceToken("token")).not.toBe(hashSessionToken("token"));
    expect(hashIpAddress("203.0.113.10")).not.toBe(hashUserAgent("203.0.113.10"));
  });

  it("compares tokens safely without accepting length mismatches", () => {
    expect(safeCompare("same-token", "same-token")).toBe(true);
    expect(safeCompare("same-token", "other-token")).toBe(false);
    expect(safeCompare("short", "much-longer")).toBe(false);
  });

  it("creates long opaque tokens for CSRF and trusted-device cookies", () => {
    const first = createOpaqueToken();
    const second = createOpaqueToken();

    expect(first.length).toBeGreaterThan(32);
    expect(second).not.toBe(first);
  });

  it("derives durable trusted-device expiration and cookie naming", () => {
    const now = new Date("2026-07-12T12:00:00.000Z");
    const expiresAt = trustedDeviceExpiresAt(now);

    expect(expiresAt.getTime()).toBe(now.getTime() + TRUSTED_DEVICE_TTL_DAYS * 24 * 60 * 60 * 1000);
    expect(getTrustedDeviceCookieName()).toBe(AUTH_COOKIE_NAMES.trustedDevice);
  });

  it("creates readable device labels from user agents", () => {
    expect(createDeviceLabel(null)).toBe("Unknown device");
    expect(createDeviceLabel("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)")).toBe(
      "Mac browser",
    );
    expect(createDeviceLabel("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")).toBe("Windows browser");
  });
});
