import type { NextRequest } from "next/server";

import { createRequestContext, jsonError, jsonOk } from "@/app/api/_shared/http";

import {
  createAdminFinancialOpsService,
  serializeAdminSettlementItem,
  serializeAdminSettlementRun,
} from "../../../_shared/financial-ops-service";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ runId: string }>;
}

export async function GET(request: NextRequest, routeContext: RouteContext) {
  const context = createRequestContext(request);

  try {
    const { runId } = await routeContext.params;
    const service = await createAdminFinancialOpsService();
    const details = await service.getSettlementRunDetails(runId);

    return jsonOk(
      {
        run: serializeAdminSettlementRun(details.run),
        items: details.items.map(serializeAdminSettlementItem),
      },
      context.requestId,
    );
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
