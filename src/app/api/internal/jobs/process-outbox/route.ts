import type { NextRequest } from "next/server";

import { createRequestContext, jsonError, jsonOk } from "@/app/api/_shared/http";
import { dispatchQueuedEmails } from "@/app/api/auth/_shared/dispatch-emails";
import {
  DrizzleTransactionManager,
  NotificationRepository,
  getDatabaseConnection,
} from "@/infrastructure/database";
import { logger } from "@/infrastructure/logging/logger";

import { authorizeInternalJob } from "../../_shared/authorize-internal-job";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function processOutboxJob(request: NextRequest) {
  const context = createRequestContext(request);

  try {
    authorizeInternalJob(request);

    const emailFlush = await dispatchQueuedEmails(50);

    const { db } = getDatabaseConnection();
    const notifications = new NotificationRepository(db);
    const transactions = new DrizzleTransactionManager(db);
    const pending = await notifications.listPendingOutboxEvents(100);
    let outboxProcessed = 0;

    for (const event of pending) {
      await transactions.runInTransaction(async (tx) => {
        await notifications.markOutboxEventProcessed(tx, event.id);
      });
      outboxProcessed += 1;
    }

    const result = {
      emailFlush,
      outbox: {
        attempted: pending.length,
        processed: outboxProcessed,
      },
    };

    logger.info({ event: "internal.jobs.process_outbox", ...result }, "Processed outbox job");
    return jsonOk(result, context.requestId);
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}

/** Vercel Cron invokes GET; machine callers may use POST. */
export async function GET(request: NextRequest) {
  return processOutboxJob(request);
}

export async function POST(request: NextRequest) {
  return processOutboxJob(request);
}
