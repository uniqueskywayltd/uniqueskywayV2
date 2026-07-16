import type { NextRequest } from "next/server";

import { createRequestContext, jsonError, jsonOk } from "@/app/api/_shared/http";
import { authorizeInternalJob } from "@/app/api/internal/_shared/authorize-internal-job";
import { TransactionalEmailDispatcher } from "@/application/notifications/transactional-email-dispatcher";
import { getServerEnv } from "@/config/server-env";
import {
  DrizzleTransactionManager,
  NotificationRepository,
  getDatabaseConnection,
} from "@/infrastructure/database";
import { ResendEmailSender } from "@/infrastructure/email";

export async function POST(request: NextRequest) {
  const context = createRequestContext(request);

  try {
    authorizeInternalJob(request);

    const { db } = getDatabaseConnection();
    const dispatcher = new TransactionalEmailDispatcher(
      new NotificationRepository(db),
      new DrizzleTransactionManager(db),
      ResendEmailSender.fromApiKey(getServerEnv().RESEND_API_KEY),
    );

    const result = await dispatcher.dispatchQueued();
    return jsonOk(result, context.requestId);
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
