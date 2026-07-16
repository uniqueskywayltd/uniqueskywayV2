import type { NextRequest } from "next/server";

import {
  createRequestContext,
  jsonError,
  jsonOk,
  parseJson,
  requireCsrf,
  requireSameOrigin,
} from "@/app/api/_shared/http";
import { adminUpdateInvestmentInputSchema } from "@/application/admin";

import {
  createAdminFinancialOpsAuditContext,
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

export async function PATCH(request: NextRequest, routeContext: RouteContext) {
  const context = createRequestContext(request);

  try {
    requireSameOrigin(request);
    await requireCsrf(request);
    const { investmentId } = await routeContext.params;
    const input = await parseJson(request, adminUpdateInvestmentInputSchema);
    const service = await createAdminFinancialOpsService();
    const investment = await service.updateInvestment(
      investmentId,
      {
        ...(input.status ? { status: input.status } : {}),
        ...(input.reason ? { reason: input.reason } : {}),
      },
      createAdminFinancialOpsAuditContext(context),
    );

    return jsonOk({ investment: serializeAdminInvestment(investment) }, context.requestId);
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
