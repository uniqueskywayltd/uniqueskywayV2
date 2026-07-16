import "server-only";

import type { EmailSender } from "@/application/ports";
import {
  PLATFORM_FROM_ADDRESS,
  PLATFORM_SUPPORT_EMAIL,
  sanitizeResendTagValue,
} from "@/config/email-identity";
import type { DrizzleTransactionManager, NotificationRepository } from "@/infrastructure/database";
import { logger } from "@/infrastructure/logging/logger";

import { renderTransactionalEmail } from "./transactional-email-templates";

export interface TransactionalEmailDispatchResult {
  processed: number;
  sent: number;
  failed: number;
  skipped: number;
}

const MAX_EMAIL_ATTEMPTS = 5;

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
    let skipped = 0;
    const from = PLATFORM_FROM_ADDRESS;

    for (const message of messages) {
      if (message.attemptCount >= MAX_EMAIL_ATTEMPTS) {
        logger.error(
          {
            event: "email.dispatch.max_attempts",
            emailMessageId: message.id,
            templateKey: message.templateKey,
            toEmail: message.toEmail,
            attemptCount: message.attemptCount,
            lastError: message.lastError,
          },
          "Email abandoned after max delivery attempts",
        );
        skipped += 1;
        continue;
      }

      const startedAt = Date.now();
      await this.transactionManager.runInTransaction((tx) =>
        this.notifications.markEmailSending(tx, message.id),
      );

      try {
        const rendered = await renderTransactionalEmail({
          templateKey: message.templateKey,
          metadata: message.metadata,
        });
        const category = sanitizeResendTagValue(
          message.templateKey.split(".")[0] ?? "transactional",
        );
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
            { name: "category", value: category },
            { name: "template", value: sanitizeResendTagValue(message.templateKey) },
          ],
        });

        const durationMs = Date.now() - startedAt;
        await this.transactionManager.runInTransaction((tx) =>
          this.notifications.markEmailSent(tx, message.id, result.providerMessageId),
        );
        logger.info(
          {
            event: "email.dispatch.sent",
            emailMessageId: message.id,
            templateKey: message.templateKey,
            previewId: rendered.previewId,
            toEmail: message.toEmail,
            subject: rendered.subject,
            providerMessageId: result.providerMessageId,
            attemptCount: message.attemptCount,
            durationMs,
            from,
          },
          "Transactional email delivered",
        );
        sent += 1;
      } catch (error) {
        const cause = error instanceof Error ? error.message : "Unknown error";
        const durationMs = Date.now() - startedAt;
        const details =
          error && typeof error === "object" && "details" in error
            ? (error as { details?: unknown }).details
            : undefined;
        logger.error(
          {
            event: "email.dispatch.failed",
            emailMessageId: message.id,
            templateKey: message.templateKey,
            toEmail: message.toEmail,
            subject: typeof message.metadata.subject === "string" ? message.metadata.subject : null,
            attemptCount: message.attemptCount + 1,
            durationMs,
            cause,
            providerError: details,
            from,
          },
          "Transactional email delivery failed",
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
      skipped,
    };
  }
}
