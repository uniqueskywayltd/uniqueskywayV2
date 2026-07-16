import "server-only";

import { AUTH_EMAIL_TEMPLATES } from "./constants";

import type { DrizzleTransactionContext } from "@/infrastructure/database";
import type { NotificationRepository } from "@/infrastructure/database";

export type IdentityEmailTemplate =
  (typeof AUTH_EMAIL_TEMPLATES)[keyof typeof AUTH_EMAIL_TEMPLATES];

export interface QueueIdentityEmailInput {
  recipientUserId?: string | null;
  toEmail: string;
  templateKey: IdentityEmailTemplate;
  idempotencyKey: string;
  metadata?: Record<string, unknown>;
  /** When set, the message stays queued until this time (picked up by the email job). */
  availableAt?: Date;
}

export class IdentityEmailQueue {
  constructor(private readonly notifications: NotificationRepository) {}

  async enqueue(context: DrizzleTransactionContext, input: QueueIdentityEmailInput) {
    const metadata = {
      ...(input.metadata ?? {}),
      ...(input.availableAt ? { availableAt: input.availableAt.toISOString() } : {}),
    };

    const message = await this.notifications.enqueueEmail(context, {
      recipientUserId: input.recipientUserId ?? null,
      toEmail: input.toEmail,
      templateKey: input.templateKey,
      templateVersion: "v1",
      idempotencyKey: input.idempotencyKey,
      metadata,
    });

    await this.notifications.enqueueOutboxEvent(context, {
      eventType: "identity.email_queued",
      aggregateType: "email_message",
      aggregateId: message.id,
      payload: {
        templateKey: input.templateKey,
        recipientUserId: input.recipientUserId ?? null,
      },
      ...(input.availableAt ? { availableAt: input.availableAt } : {}),
    });

    return message;
  }
}
