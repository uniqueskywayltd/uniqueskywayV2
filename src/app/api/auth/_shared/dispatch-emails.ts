import { TransactionalEmailDispatcher } from "@/application/notifications/transactional-email-dispatcher";
import type { TransactionalEmailDispatchResult } from "@/application/notifications/transactional-email-dispatcher";
import { getServerEnv } from "@/config/server-env";
import {
  DrizzleTransactionManager,
  NotificationRepository,
  getDatabaseConnection,
} from "@/infrastructure/database";
import { ResendEmailSender } from "@/infrastructure/email";
import { logger } from "@/infrastructure/logging/logger";

/** Flush queued emails after actions that enqueue mail. Returns null if flush itself errors. */
export async function dispatchQueuedEmails(
  limit = 25,
): Promise<TransactionalEmailDispatchResult | null> {
  try {
    const { db } = getDatabaseConnection();
    const dispatcher = new TransactionalEmailDispatcher(
      new NotificationRepository(db),
      new DrizzleTransactionManager(db),
      ResendEmailSender.fromApiKey(getServerEnv().RESEND_API_KEY),
    );

    let result = await dispatcher.dispatchQueued(limit);

    // One immediate retry when the first pass sent nothing but failures occurred,
    // or when reclaimable work may remain after a partial flush error.
    if (result.failed > 0 || (result.processed > 0 && result.sent === 0 && result.skipped === 0)) {
      const retry = await dispatcher.dispatchQueued(limit);
      result = {
        processed: result.processed + retry.processed,
        sent: result.sent + retry.sent,
        failed: retry.failed,
        skipped: result.skipped + retry.skipped,
      };
    }

    if (result.failed > 0) {
      logger.error(
        {
          event: "email.dispatch.flush_partial_failure",
          processed: result.processed,
          sent: result.sent,
          failed: result.failed,
          skipped: result.skipped,
        },
        "Email flush completed with delivery failures",
      );
    } else if (result.sent > 0) {
      logger.info(
        {
          event: "email.dispatch.flush_ok",
          processed: result.processed,
          sent: result.sent,
        },
        "Email flush delivered queued messages",
      );
    }
    return result;
  } catch (error) {
    // Queue remains for the internal job route; callers must not claim delivery success.
    logger.error(
      {
        event: "email.dispatch.flush_error",
        cause: error instanceof Error ? error.message : "Unknown error",
      },
      "Email flush failed before provider delivery",
    );
    return null;
  }
}
