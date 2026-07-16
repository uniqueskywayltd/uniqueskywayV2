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

import { dispatchQueuedEmails } from "../_shared/dispatch-emails";
import { createAuthService } from "../_shared/service";

export async function POST(request: NextRequest) {
  const context = createRequestContext(request);

  try {
    requireSameOrigin(request);
    await requireCsrf(request);
    const input = await parseJson(request, registerInputSchema);
    const service = await createAuthService({ rememberSession: input.rememberMe });
    const result = await service.register(input, context);
    const flush = await dispatchQueuedEmails(25);
    if (!flush || flush.failed > 0) {
      // Best-effort second pass so signup OTP is not left stranded in the queue.
      await dispatchQueuedEmails(25);
    }
    return jsonOk(result, context.requestId, { status: 202 });
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
