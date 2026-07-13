import "server-only";

import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";

import { AUTH_COOKIE_NAMES, TRUSTED_DEVICE_TTL_DAYS } from "./constants";

export interface RequestSecurityContext {
  requestId: string;
  ipAddress: string | null;
  userAgent: string | null;
  origin: string | null;
}

export function createRequestId(): string {
  return randomUUID();
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function createOpaqueToken(byteLength = 32): string {
  return randomBytes(byteLength).toString("base64url");
}

export function createTrustedDeviceToken(): string {
  return createOpaqueToken(32);
}

export function hashTrustedDeviceToken(token: string): string {
  return sha256(`trusted-device:${token}`);
}

export function hashSessionToken(refreshToken: string): string {
  return sha256(`session:${refreshToken}`);
}

export function hashIpAddress(ipAddress: string | null): string | null {
  return ipAddress === null ? null : sha256(`ip:${ipAddress}`);
}

export function hashUserAgent(userAgent: string | null): string | null {
  return userAgent === null ? null : sha256(`ua:${userAgent}`);
}

export function createDeviceLabel(userAgent: string | null): string {
  if (!userAgent) {
    return "Unknown device";
  }

  if (userAgent.includes("iPhone")) return "iPhone browser";
  if (userAgent.includes("iPad")) return "iPad browser";
  if (userAgent.includes("Android")) return "Android browser";
  if (userAgent.includes("Macintosh")) return "Mac browser";
  if (userAgent.includes("Windows")) return "Windows browser";
  if (userAgent.includes("Linux")) return "Linux browser";

  return "Browser session";
}

export function trustedDeviceExpiresAt(now = new Date()): Date {
  return new Date(now.getTime() + TRUSTED_DEVICE_TTL_DAYS * 24 * 60 * 60 * 1000);
}

export function createCsrfToken(): string {
  return createOpaqueToken(32);
}

export function safeCompare(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function getTrustedDeviceCookieName(): string {
  return AUTH_COOKIE_NAMES.trustedDevice;
}
