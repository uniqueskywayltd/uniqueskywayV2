import type { NextRequest } from "next/server";

import {
  createRequestContext,
  jsonError,
  jsonOk,
  requireCsrf,
  requireSameOrigin,
} from "@/app/api/_shared/http";
import {
  createAdminFinancialOpsAuditContext,
  createAdminFinancialOpsService,
} from "@/app/api/admin/_shared/financial-ops-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ planVersionId: string }>;
};

export async function PATCH(request: NextRequest, routeContext: RouteContext) {
  const context = createRequestContext(request);

  try {
    requireSameOrigin(request);
    await requireCsrf(request);
    const { planVersionId } = await routeContext.params;
    const body = (await request.json()) as Record<string, unknown>;
    const service = await createAdminFinancialOpsService();

    const input: Parameters<typeof service.updateInvestmentPlanVersion>[1] = {};
    if (body.status === "draft" || body.status === "active" || body.status === "retired") {
      input.status = body.status;
    }
    if (
      body.planStatus === "draft" ||
      body.planStatus === "active" ||
      body.planStatus === "retired"
    ) {
      input.planStatus = body.planStatus;
    }
    if (typeof body.minPrincipalMinor === "string") {
      input.minPrincipalMinor = body.minPrincipalMinor;
    }
    if (typeof body.maxPrincipalMinor === "string") {
      input.maxPrincipalMinor = body.maxPrincipalMinor;
    }
    if (typeof body.termDays === "number") input.termDays = body.termDays;
    if (typeof body.dailyRoiBps === "number") input.dailyRoiBps = body.dailyRoiBps;
    if (body.totalRoiBps === null) input.totalRoiBps = null;
    else if (typeof body.totalRoiBps === "number") input.totalRoiBps = body.totalRoiBps;
    if (
      body.earlyExitPolicy === "allowed_with_penalty" ||
      body.earlyExitPolicy === "admin_review" ||
      body.earlyExitPolicy === "not_allowed"
    ) {
      input.earlyExitPolicy = body.earlyExitPolicy;
    }
    if (typeof body.earlyExitPenaltyBps === "number") {
      input.earlyExitPenaltyBps = body.earlyExitPenaltyBps;
    }

    const result = await service.updateInvestmentPlanVersion(
      planVersionId,
      input,
      createAdminFinancialOpsAuditContext(context),
    );
    return jsonOk(result, context.requestId);
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
