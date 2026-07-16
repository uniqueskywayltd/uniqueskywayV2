import "server-only";

import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";

import { AUTH_COOKIE_NAMES, TRUSTED_DEVICE_TTL_DAYS } from "./constants";

export interface RequestSecurityContext {
  requestId: string;
  ipAddress: string | null;
  userAgent: string | null;
  origin: string | null;
  /** Coarse geo hint from CDN headers (e.g. country code), when available. */
  approximateLocation: string | null;
}

export interface DeviceFingerprint {
  label: string;
  browser: string;
  os: string;
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

export function parseDeviceFingerprint(userAgent: string | null): DeviceFingerprint {
  if (!userAgent) {
    return { label: "Unknown device", browser: "Unknown browser", os: "Unknown OS" };
  }

  const os = detectOs(userAgent);
  const browser = detectBrowser(userAgent);
  return {
    browser,
    os,
    label: `${browser} on ${os}`,
  };
}

export function createDeviceLabel(userAgent: string | null): string {
  return parseDeviceFingerprint(userAgent).label;
}

export function maskIpAddress(ipAddress: string | null): string | null {
  if (!ipAddress) return null;

  if (ipAddress.includes(":")) {
    const parts = ipAddress.split(":");
    if (parts.length < 2) return "***";
    return `${parts.slice(0, 2).join(":")}:****`;
  }

  const octets = ipAddress.split(".");
  if (octets.length !== 4) return "***";
  return `${octets[0]}.${octets[1]}.***.***`;
}

function detectOs(userAgent: string): string {
  if (userAgent.includes("iPhone")) return "iOS";
  if (userAgent.includes("iPad")) return "iPadOS";
  if (/Android/i.test(userAgent)) return "Android";
  if (/Mac OS X|Macintosh/i.test(userAgent)) return "macOS";
  if (/Windows NT/i.test(userAgent)) return "Windows";
  if (/CrOS/i.test(userAgent)) return "Chrome OS";
  if (/Linux/i.test(userAgent)) return "Linux";
  return "Unknown OS";
}

function detectBrowser(userAgent: string): string {
  if (/Edg\//i.test(userAgent)) return "Edge";
  if (/OPR\//i.test(userAgent) || /Opera/i.test(userAgent)) return "Opera";
  if (/Firefox\//i.test(userAgent)) return "Firefox";
  if (/Chrome\//i.test(userAgent) && !/Edg\//i.test(userAgent)) return "Chrome";
  if (/Safari\//i.test(userAgent) && !/Chrome\//i.test(userAgent)) return "Safari";
  return "Browser";
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
