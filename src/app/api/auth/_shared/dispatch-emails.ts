import { TransactionalEmailDispatcher } from "@/application/notifications/transactional-email-dispatcher";
import { getServerEnv } from "@/config/server-env";
import {
  DrizzleTransactionManager,
  NotificationRepository,
  getDatabaseConnection,
} from "@/infrastructure/database";
import { ResendEmailSender } from "@/infrastructure/email";
import { logger } from "@/infrastructure/logging/logger";

/** Best-effort flush of queued emails after auth actions (does not throw to callers). */
export async function dispatchQueuedEmails(limit = 25): Promise<void> {
  try {
    const { db } = getDatabaseConnection();
    const dispatcher = new TransactionalEmailDispatcher(
      new NotificationRepository(db),
      new DrizzleTransactionManager(db),
      ResendEmailSender.fromApiKey(getServerEnv().RESEND_API_KEY),
    );
    const result = await dispatcher.dispatchQueued(limit);
    if (result.failed > 0) {
      logger.error(
        {
          event: "email.dispatch.flush_partial_failure",
          processed: result.processed,
          sent: result.sent,
          failed: result.failed,
        },
        "Email flush completed with delivery failures",
      );
    }
  } catch (error) {
    // Queue remains for the internal job route; registration/login must not fail on send.
    logger.error(
      {
        event: "email.dispatch.flush_error",
        cause: error instanceof Error ? error.message : "Unknown error",
      },
      "Email flush failed before provider delivery",
    );
  }
}
