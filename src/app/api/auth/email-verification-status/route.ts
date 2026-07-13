import type { NextRequest } from "next/server";

import { createRequestContext, jsonError, jsonOk } from "@/app/api/_shared/http";

import { createAuthService } from "../_shared/service";

export async function GET(request: NextRequest) {
  const context = createRequestContext(request);

  try {
    const service = await createAuthService();
    const result = await service.getEmailVerificationStatus();
    return jsonOk(result, context.requestId);
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
