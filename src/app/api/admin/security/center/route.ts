import type { NextRequest } from "next/server";

import { createRequestContext, jsonError, jsonOk } from "@/app/api/_shared/http";

import { createAdminSystemService } from "../../_shared/system-service";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const context = createRequestContext(request);
  try {
    const service = await createAdminSystemService();
    const center = await service.getSecurityCenter();
    return jsonOk(center, context.requestId);
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
