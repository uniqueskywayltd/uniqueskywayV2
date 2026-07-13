import "server-only";

import { createHash } from "node:crypto";

import { AppError } from "@/application/errors";

/**
 * Default maximum internal retry attempts before a provider event is
 * dead-lettered, per WEBHOOK_SPECIFICATION.md Retry Policy.
 */
export const MAX_PROVIDER_EVENT_ATTEMPTS = 10;

/**
 * Backoff schedule in minutes indexed by attempt number (1-based).
 * Attempts beyond the schedule length retry hourly, per
 * WEBHOOK_SPECIFICATION.md Retry Policy.
 */
const RETRY_BACKOFF_MINUTES = [1, 5, 15, 30, 60] as const;

export interface PaystackWebhookEvent {
  event: string;
  data: {
    id?: number | string;
    reference?: string;
    status?: string;
    amount?: number | string;
    currency?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export function parsePaystackWebhook(rawBody: string): PaystackWebhookEvent {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody) as unknown;
  } catch (error) {
    throw new AppError({
      code: "VALIDATION_ERROR",
      message: "Webhook payload must be valid JSON.",
      cause: error,
    });
  }
  if (!parsed || typeof parsed !== "object") {
    throw new AppError({ code: "VALIDATION_ERROR", message: "Webhook payload must be an object." });
  }
  const event = parsed as PaystackWebhookEvent;
  if (typeof event.event !== "string" || !event.data || typeof event.data !== "object") {
    throw new AppError({
      code: "VALIDATION_ERROR",
      message: "Webhook payload is missing event data.",
    });
  }
  return event;
}

/**
 * Best-effort peek at the Paystack event type for webhook route dispatch
 * only. This does not verify the signature and must never be used to
 * authorize processing or financial side effects.
 */
export function peekPaystackWebhookEventType(rawBody: string): string | null {
  try {
    const parsed = JSON.parse(rawBody) as unknown;
    if (parsed && typeof parsed === "object" && typeof (parsed as { event?: unknown }).event === "string") {
      return (parsed as { event: string }).event;
    }
  } catch {
    return null;
  }
  return null;
}

export function createProviderEventId(event: PaystackWebhookEvent): string {
  const reference = requireProviderReference(event);
  const providerId = event.data.id === undefined ? reference : String(event.data.id);
  return `${event.event}:${providerId}`;
}

export function requireProviderReference(event: PaystackWebhookEvent): string {
  if (typeof event.data.reference !== "string" || !event.data.reference.trim()) {
    throw new AppError({
      code: "VALIDATION_ERROR",
      message: "Webhook payload is missing provider reference.",
    });
  }
  return event.data.reference;
}

export function hashWebhookPayload(rawBody: string): string {
  return createHash("sha256").update(rawBody).digest("hex");
}

const HOURLY_BACKOFF_MINUTES = 60;

export function computeRetryBackoffMs(attemptCount: number): number {
  const index = Math.min(Math.max(attemptCount, 1), RETRY_BACKOFF_MINUTES.length) - 1;
  const minutes = RETRY_BACKOFF_MINUTES[index] ?? HOURLY_BACKOFF_MINUTES;
  return minutes * 60_000;
}
