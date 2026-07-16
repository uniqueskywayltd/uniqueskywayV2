import type { NextRequest } from "next/server";

import {
  createRequestContext,
  jsonError,
  jsonOk,
  parseJson,
  requireCsrf,
  requireSameOrigin,
} from "@/app/api/_shared/http";
import { resetPasswordInputSchema } from "@/application/auth";

import { dispatchQueuedEmails } from "../../_shared/dispatch-emails";
import { createAuthService } from "../../_shared/service";

export async function POST(request: NextRequest) {
  const context = createRequestContext(request);

  try {
    requireSameOrigin(request);
    await requireCsrf(request);
    const input = await parseJson(request, resetPasswordInputSchema);
    const service = await createAuthService({ rememberSession: true });
    const result = await service.resetPassword(input, context);
    await dispatchQueuedEmails(25);
    return jsonOk(result, context.requestId);
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
