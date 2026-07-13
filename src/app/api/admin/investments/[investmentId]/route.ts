import type { NextRequest } from "next/server";

import { createRequestContext, jsonError, jsonOk } from "@/app/api/_shared/http";

import {
  createAdminFinancialOpsService,
  serializeAdminInvestment,
  serializeAdminRoiScheduleItem,
  serializeAdminSettlementItem,
} from "../../_shared/financial-ops-service";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ investmentId: string }>;
}

export async function GET(request: NextRequest, routeContext: RouteContext) {
  const context = createRequestContext(request);

  try {
    const { investmentId } = await routeContext.params;
    const service = await createAdminFinancialOpsService();
    const details = await service.getInvestmentDetails(investmentId);

    return jsonOk(
      {
        investment: serializeAdminInvestment(details.investment),
        roiScheduleItems: details.roiScheduleItems.map(serializeAdminRoiScheduleItem),
        settlementItems: details.settlementItems.map(serializeAdminSettlementItem),
        postedRoiMinor: details.postedRoiMinor.toString(),
      },
      context.requestId,
    );
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
