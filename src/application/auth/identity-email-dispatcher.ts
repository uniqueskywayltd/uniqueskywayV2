import "server-only";

import type { EmailSender } from "@/application/ports";
import { getServerEnv } from "@/config/server-env";
import type { DrizzleTransactionManager, NotificationRepository } from "@/infrastructure/database";

import type { IdentityEmailTemplate } from "./identity-email-queue";
import { renderIdentityEmail } from "./identity-email-templates";

export interface IdentityEmailDispatchResult {
  processed: number;
  sent: number;
  failed: number;
}

export class IdentityEmailDispatcher {
  constructor(
    private readonly notifications: NotificationRepository,
    private readonly transactionManager: DrizzleTransactionManager,
    private readonly emailSender: EmailSender,
  ) {}

  async dispatchQueued(limit = 10): Promise<IdentityEmailDispatchResult> {
    const messages = await this.notifications.listQueuedIdentityEmails(limit);
    let sent = 0;
    let failed = 0;

    for (const message of messages) {
      await this.transactionManager.runInTransaction((tx) =>
        this.notifications.markEmailSending(tx, message.id),
      );

      try {
        const rendered = renderIdentityEmail({
          templateKey: message.templateKey as IdentityEmailTemplate,
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
            { name: "category", value: "identity" },
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
