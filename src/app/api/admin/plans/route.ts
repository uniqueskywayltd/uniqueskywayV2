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

export async function GET(request: NextRequest) {
  const context = createRequestContext(request);

  try {
    const service = await createAdminFinancialOpsService();
    const result = await service.listInvestmentPlans();
    return jsonOk(result, context.requestId);
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}

export async function POST(request: NextRequest) {
  const context = createRequestContext(request);

  try {
    requireSameOrigin(request);
    await requireCsrf(request);
    const body = (await request.json()) as Record<string, unknown>;
    const service = await createAdminFinancialOpsService();
    const result = await service.createInvestmentPlan(
      {
        slug: String(body.slug ?? ""),
        name: String(body.name ?? ""),
        description: typeof body.description === "string" ? body.description : null,
        currency: String(body.currency ?? "USD"),
        minPrincipalMinor: String(body.minPrincipalMinor ?? "0"),
        maxPrincipalMinor: String(body.maxPrincipalMinor ?? "0"),
        termDays: Number(body.termDays ?? 0),
        dailyRoiBps: Number(body.dailyRoiBps ?? 0),
        totalRoiBps:
          body.totalRoiBps === null || body.totalRoiBps === undefined
            ? null
            : Number(body.totalRoiBps),
        earlyExitPolicy:
          body.earlyExitPolicy === "allowed_with_penalty" ||
          body.earlyExitPolicy === "admin_review" ||
          body.earlyExitPolicy === "not_allowed"
            ? body.earlyExitPolicy
            : "allowed_with_penalty",
        earlyExitPenaltyBps: Number(body.earlyExitPenaltyBps ?? 0),
      },
      createAdminFinancialOpsAuditContext(context),
    );
    return jsonOk(result, context.requestId);
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
