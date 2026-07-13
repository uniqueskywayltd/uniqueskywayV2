import type { NextRequest } from "next/server";

import { createRequestContext, jsonError, jsonOk } from "@/app/api/_shared/http";
import { AppError } from "@/application/errors";
import { IdentityEmailDispatcher } from "@/application/auth/identity-email-dispatcher";
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
    const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (token !== getServerEnv().INTERNAL_JOB_TOKEN) {
      return jsonError(
        new AppError({
          code: "AUTHORIZATION_ERROR",
          message: "Unauthorized internal job request.",
        }),
        context.requestId,
      );
    }

    const { db } = getDatabaseConnection();
    const dispatcher = new IdentityEmailDispatcher(
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
