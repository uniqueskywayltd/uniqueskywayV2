import type { NextRequest } from "next/server";

import { createRequestContext, jsonError, jsonOk } from "@/app/api/_shared/http";

import { createAuthService } from "../_shared/service";

export async function GET(request: NextRequest) {
  const context = createRequestContext(request);

  try {
    const service = await createAuthService();
    const sessions = await service.listSessions();
    return jsonOk({ sessions }, context.requestId);
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
