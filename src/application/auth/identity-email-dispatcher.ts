import "server-only";

import type { EmailSender } from "@/application/ports";
import { renderTransactionalEmail } from "@/application/notifications/transactional-email-templates";
import {
  PLATFORM_SUPPORT_EMAIL,
  resolveResendFromAddress,
  sanitizeResendTagValue,
} from "@/config/email-identity";
import { getServerEnv } from "@/config/server-env";
import type { DrizzleTransactionManager, NotificationRepository } from "@/infrastructure/database";
import { logger } from "@/infrastructure/logging/logger";

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
    const from = resolveResendFromAddress(getServerEnv().RESEND_FROM_EMAIL);

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
          from,
          to: message.toEmail,
          subject: rendered.subject,
          html: rendered.html,
          text: rendered.text,
          idempotencyKey: message.idempotencyKey,
          headers: {
            "Reply-To": PLATFORM_SUPPORT_EMAIL,
          },
          tags: [
            { name: "category", value: "identity" },
            { name: "template", value: sanitizeResendTagValue(message.templateKey) },
          ],
        });

        await this.transactionManager.runInTransaction((tx) =>
          this.notifications.markEmailSent(tx, message.id, result.providerMessageId),
        );
        sent += 1;
      } catch (error) {
        const cause = error instanceof Error ? error.message : "Unknown error";
        logger.error(
          {
            event: "email.dispatch.failed",
            emailMessageId: message.id,
            templateKey: message.templateKey,
            toEmail: message.toEmail,
            cause,
          },
          "Identity email delivery failed",
        );
        await this.transactionManager.runInTransaction((tx) =>
          this.notifications.markEmailFailed(tx, message.id, cause),
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
