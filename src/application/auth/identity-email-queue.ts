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
}

export class IdentityEmailQueue {
  constructor(private readonly notifications: NotificationRepository) {}

  async enqueue(context: DrizzleTransactionContext, input: QueueIdentityEmailInput) {
    const message = await this.notifications.enqueueEmail(context, {
      recipientUserId: input.recipientUserId ?? null,
      toEmail: input.toEmail,
      templateKey: input.templateKey,
      templateVersion: "v1",
      idempotencyKey: input.idempotencyKey,
      metadata: input.metadata ?? {},
    });

    await this.notifications.enqueueOutboxEvent(context, {
      eventType: "identity.email_queued",
      aggregateType: "email_message",
      aggregateId: message.id,
      payload: {
        templateKey: input.templateKey,
        recipientUserId: input.recipientUserId ?? null,
      },
    });

    return message;
  }
}
