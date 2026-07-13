import type { NextRequest } from "next/server";

import { createRequestContext, jsonError, jsonOk } from "@/app/api/_shared/http";
import { listFinancialTimelineQuerySchema } from "@/application/admin";

import {
  createAdminFinancialOpsService,
  serializeAdminFinancialAuditLog,
} from "../../../_shared/financial-ops-service";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ depositId: string }>;
}

export async function GET(request: NextRequest, routeContext: RouteContext) {
  const context = createRequestContext(request);

  try {
    const { depositId } = await routeContext.params;
    const { limit } = listFinancialTimelineQuerySchema.parse({
      limit: request.nextUrl.searchParams.get("limit") ?? undefined,
    });

    const service = await createAdminFinancialOpsService();
    const timeline = await service.getDepositTimeline(depositId, limit);

    return jsonOk({ timeline: timeline.map(serializeAdminFinancialAuditLog) }, context.requestId);
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
