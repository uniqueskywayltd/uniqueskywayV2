import { describe, expect, it, vi } from "vitest";

import type { DrizzleTransactionContext, NotificationRepository } from "@/infrastructure/database";

import { AUTH_EMAIL_TEMPLATES } from "./constants";
import { IdentityEmailQueue } from "./identity-email-queue";

describe("IdentityEmailQueue", () => {
  it("enqueues email and transactional outbox event in the same transaction context", async () => {
    const context = { db: {}, transactionId: "tx_email_queue" } as DrizzleTransactionContext;
    const emailMessage = { id: "email_message_1" };
    const notifications = {
      enqueueEmail: vi.fn(async () => emailMessage),
      enqueueOutboxEvent: vi.fn(async () => ({ id: "outbox_event_1" })),
    };
    const queue = new IdentityEmailQueue(notifications as unknown as NotificationRepository);

    const result = await queue.enqueue(context, {
      recipientUserId: "user_1",
      toEmail: "investor@example.com",
      templateKey: AUTH_EMAIL_TEMPLATES.verifyEmail,
      idempotencyKey: "auth.verify_email:user_1",
      metadata: { otp: "123456" },
    });

    expect(result).toBe(emailMessage);
    expect(notifications.enqueueEmail).toHaveBeenCalledWith(
      context,
      expect.objectContaining({
        recipientUserId: "user_1",
        toEmail: "investor@example.com",
        templateKey: AUTH_EMAIL_TEMPLATES.verifyEmail,
        templateVersion: "v1",
        idempotencyKey: "auth.verify_email:user_1",
        metadata: { otp: "123456" },
      }),
    );
    expect(notifications.enqueueOutboxEvent).toHaveBeenCalledWith(
      context,
      expect.objectContaining({
        eventType: "identity.email_queued",
        aggregateType: "email_message",
        aggregateId: "email_message_1",
      }),
    );
  });
});
