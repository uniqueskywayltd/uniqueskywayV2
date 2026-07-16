import "server-only";

import type { EmailSender } from "@/application/ports";
import { getServerEnv } from "@/config/server-env";
import type { DrizzleTransactionManager, NotificationRepository } from "@/infrastructure/database";

import { renderTransactionalEmail } from "./transactional-email-templates";

export interface TransactionalEmailDispatchResult {
  processed: number;
  sent: number;
  failed: number;
}

/** Dispatches queued identity + transactional emails without duplicate sends (idempotency keys). */
export class TransactionalEmailDispatcher {
  constructor(
    private readonly notifications: NotificationRepository,
    private readonly transactionManager: DrizzleTransactionManager,
    private readonly emailSender: EmailSender,
  ) {}

  async dispatchQueued(limit = 25): Promise<TransactionalEmailDispatchResult> {
    const messages = await this.notifications.listQueuedEmails(limit);
    let sent = 0;
    let failed = 0;

    for (const message of messages) {
      await this.transactionManager.runInTransaction((tx) =>
        this.notifications.markEmailSending(tx, message.id),
      );

      try {
        const rendered = renderTransactionalEmail({
          templateKey: message.templateKey,
          metadata: message.metadata,
        });
        const result = await this.emailSender.send({
          from: getServerEnv().RESEND_FROM_EMAIL,
          to: message.toEmail,
          subject: rendered.subject,
          html: rendered.html,
          text: rendered.text,
          idempotencyKey: message.idempotencyKey,
          tags: [
            { name: "category", value: message.templateKey.split(".")[0] ?? "transactional" },
            { name: "template", value: message.templateKey },
          ],
        });

        await this.transactionManager.runInTransaction((tx) =>
          this.notifications.markEmailSent(tx, message.id, result.providerMessageId),
        );
        sent += 1;
      } catch (error) {
        await this.transactionManager.runInTransaction((tx) =>
          this.notifications.markEmailFailed(
            tx,
            message.id,
            error instanceof Error ? error.message : "Unknown error",
          ),
        );
        failed += 1;
      }
    }

    return {
      processed: messages.length,
      sent,
      failed,
    };
  }
}
