import { TransactionalEmailDispatcher } from "@/application/notifications/transactional-email-dispatcher";
import { getServerEnv } from "@/config/server-env";
import {
  DrizzleTransactionManager,
  NotificationRepository,
  getDatabaseConnection,
} from "@/infrastructure/database";
import { ResendEmailSender } from "@/infrastructure/email";

/** Best-effort flush of queued emails after auth actions (does not throw to callers). */
export async function dispatchQueuedEmails(limit = 10): Promise<void> {
  try {
    const { db } = getDatabaseConnection();
    const dispatcher = new TransactionalEmailDispatcher(
      new NotificationRepository(db),
      new DrizzleTransactionManager(db),
      ResendEmailSender.fromApiKey(getServerEnv().RESEND_API_KEY),
    );
    await dispatcher.dispatchQueued(limit);
  } catch {
    // Queue remains for the internal job route; registration/login must not fail on send.
  }
}
