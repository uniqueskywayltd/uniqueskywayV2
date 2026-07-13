import type { NextRequest } from "next/server";

import { createRequestContext, jsonError, jsonOk } from "@/app/api/_shared/http";

import { createAdminSystemService } from "../../_shared/system-service";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ userId: string }>;
}

export async function GET(request: NextRequest, routeContext: RouteContext) {
  const context = createRequestContext(request);
  try {
    const { userId } = await routeContext.params;
    const service = await createAdminSystemService();
    const staff = await service.getStaffDetails(userId);
    return jsonOk({ staff }, context.requestId);
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
