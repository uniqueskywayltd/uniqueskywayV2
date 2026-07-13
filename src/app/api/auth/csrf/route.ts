import type { NextRequest } from "next/server";

import { createCsrfResponse, createRequestContext, jsonError } from "@/app/api/_shared/http";

export async function GET(request: NextRequest) {
  const context = createRequestContext(request);

  try {
    return await createCsrfResponse(context.requestId);
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
