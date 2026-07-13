import type { NextRequest } from "next/server";

import {
  createRequestContext,
  jsonError,
  jsonOk,
  parseJson,
  requireCsrf,
  requireSameOrigin,
} from "@/app/api/_shared/http";
import { forgotPasswordInputSchema } from "@/application/auth";

import { createAuthService } from "../../_shared/service";

export async function POST(request: NextRequest) {
  const context = createRequestContext(request);

  try {
    requireSameOrigin(request);
    await requireCsrf(request);
    const input = await parseJson(request, forgotPasswordInputSchema);
    const service = await createAuthService();
    const result = await service.forgotPassword(input, context);
    return jsonOk(result, context.requestId, { status: 202 });
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
