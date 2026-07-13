import type { NextRequest } from "next/server";

import { createRequestContext, jsonError, jsonOk } from "@/app/api/_shared/http";
import { listCustomerAuditQuerySchema } from "@/application/admin";

import { createAdminCustomerService, serializeAdminAuditLog } from "../../../_shared/customer-service";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ userId: string }>;
}

export async function GET(request: NextRequest, routeContext: RouteContext) {
  const context = createRequestContext(request);

  try {
    const { userId } = await routeContext.params;
    const { limit } = listCustomerAuditQuerySchema.parse({
      limit: request.nextUrl.searchParams.get("limit") ?? undefined,
    });

    const service = await createAdminCustomerService();
    const auditLogs = await service.getCustomerAuditTimeline(userId, limit);

    return jsonOk({ auditLogs: auditLogs.map(serializeAdminAuditLog) }, context.requestId);
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
