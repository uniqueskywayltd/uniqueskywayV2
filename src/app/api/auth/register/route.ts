import type { NextRequest } from "next/server";

import {
  createRequestContext,
  jsonError,
  jsonOk,
  parseJson,
  requireCsrf,
  requireSameOrigin,
} from "@/app/api/_shared/http";
import { registerInputSchema } from "@/application/auth";
import { logger } from "@/infrastructure/logging/logger";

import { dispatchQueuedEmails } from "../_shared/dispatch-emails";
import { createAuthService } from "../_shared/service";

export async function POST(request: NextRequest) {
  const context = createRequestContext(request);

  try {
    logger.info(
      { event: "auth.registration.started", requestId: context.requestId },
      "Registration started",
    );
    requireSameOrigin(request);
    await requireCsrf(request);
    const input = await parseJson(request, registerInputSchema);
    logger.info(
      {
        event: "auth.registration.input_validated",
        requestId: context.requestId,
        toEmail: input.email,
      },
      "Registration input validated",
    );
    const service = await createAuthService({ rememberSession: input.rememberMe });
    const result = await service.register(input, context);
    logger.info(
      {
        event: "auth.registration.queued",
        requestId: context.requestId,
        toEmail: result.email,
      },
      "Registration completed and verification email queued",
    );
    const flush = await dispatchQueuedEmails(25);
    logger.info(
      {
        event: "auth.registration.email_flush",
        requestId: context.requestId,
        toEmail: result.email,
        flush,
      },
      "Registration email flush completed",
    );
    if (!flush || flush.failed > 0) {
      // Best-effort second pass so signup OTP is not left stranded in the queue.
      const retry = await dispatchQueuedEmails(25);
      logger.warn(
        {
          event: "auth.registration.email_retry",
          requestId: context.requestId,
          toEmail: result.email,
          retry,
        },
        "Registration email retry completed",
      );
    }
    return jsonOk(result, context.requestId, { status: 202 });
  } catch (error) {
    logger.error(
      {
        event: "auth.registration.failed",
        requestId: context.requestId,
        err: error,
      },
      "Registration failed",
    );
    return jsonError(error, context.requestId);
  }
}
