import "server-only";

import { getServerEnv } from "@/config/server-env";
import { PLATFORM_SUPPORT_EMAIL } from "@/config/email-identity";
import type { DrizzleTransactionContext, NotificationRepository } from "@/infrastructure/database";
import { logger } from "@/infrastructure/logging/logger";

/** Resolve finance/admin inbox from env — never hardcode recipients in call sites. */
export function resolveAdminNotifyEmail(): string {
  return getServerEnv().CONTACT_SUPPORT_EMAIL?.trim() || PLATFORM_SUPPORT_EMAIL;
}

export type AdminEmailEventType =
  | "admin.registration"
  | "admin.email_verified"
  | "admin.deposit_submitted"
  | "admin.deposit_approved"
  | "admin.deposit_rejected"
  | "admin.withdrawal_requested"
  | "admin.withdrawal_approved"
  | "admin.withdrawal_rejected"
  | "admin.investment_started"
  | "admin.investment_stopped"
  | "admin.investment_matured"
  | "admin.email_changed"
  | "admin.password_reset_requested"
  | "admin.customer_created";

export interface EnqueueAdminEmailInput {
  eventType: AdminEmailEventType;
  idempotencyKey: string;
  customerId?: string | null;
  metadata: Record<string, unknown>;
}

/**
 * Queue an administrator notification email.
 * Failures are logged (never silent) and swallowed so customer actions are not blocked.
 * Delivery retries use the existing email outbox worker.
 */
export async function enqueueAdminEmail(
  tx: DrizzleTransactionContext,
  notificationRepository: NotificationRepository,
  input: EnqueueAdminEmailInput,
): Promise<void> {
  const toEmail = resolveAdminNotifyEmail();
  try {
    await notificationRepository.enqueueEmail(tx, {
      recipientUserId: null,
      toEmail,
      templateKey: input.eventType,
      templateVersion: "v1",
      idempotencyKey: input.idempotencyKey,
      metadata: {
        ...input.metadata,
        adminEventType: input.eventType,
        ...(input.customerId ? { customerId: input.customerId } : {}),
      },
    });
  } catch (error) {
    logger.error(
      {
        event: "admin.notification.enqueue_failed",
        eventType: input.eventType,
        customerId: input.customerId ?? null,
        toEmail,
        err: error,
        exception: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      "Administrator notification failed to enqueue",
    );
  }
}
