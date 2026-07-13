import type { NextRequest } from "next/server";

import { createRequestContext, jsonError, jsonOk } from "@/app/api/_shared/http";

import { createAdminSystemService } from "../_shared/system-service";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const context = createRequestContext(request);
  try {
    const query: { action?: string; actorUserId?: string; targetType?: string } = {};
    const action = request.nextUrl.searchParams.get("action");
    const actorUserId = request.nextUrl.searchParams.get("actorUserId");
    const targetType = request.nextUrl.searchParams.get("targetType");
    if (action) query.action = action;
    if (actorUserId) query.actorUserId = actorUserId;
    if (targetType) query.targetType = targetType;
    const service = await createAdminSystemService();
    const auditLogs = await service.listAuditLogs(query);
    return jsonOk({ auditLogs }, context.requestId);
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
