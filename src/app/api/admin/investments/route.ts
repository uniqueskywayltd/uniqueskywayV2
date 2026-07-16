import type { NextRequest } from "next/server";

import {
  createRequestContext,
  jsonError,
  jsonOk,
  parseJson,
  requireCsrf,
  requireSameOrigin,
} from "@/app/api/_shared/http";
import {
  adminCreateInvestmentInputSchema,
  searchInvestmentsInputSchema,
} from "@/application/admin";
import { dispatchQueuedEmails } from "@/app/api/auth/_shared/dispatch-emails";

import {
  createAdminFinancialOpsAuditContext,
  createAdminFinancialOpsService,
  serializeAdminInvestment,
} from "../_shared/financial-ops-service";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const context = createRequestContext(request);

  try {
    const searchParams = request.nextUrl.searchParams;
    if (searchParams.get("plans") === "1") {
      const service = await createAdminFinancialOpsService();
      const plans = await service.listActivePlans();
      return jsonOk(
        {
          plans: plans.map(({ plan, version }) => ({
            planId: plan.id,
            planName: plan.name,
            planSlug: plan.slug,
            planVersionId: version.id,
            currency: version.currency,
            dailyRoiBps: version.dailyRoiBps,
            totalRoiBps: version.totalRoiBps,
            termDays: version.termDays,
            minPrincipalMinor: version.minPrincipalMinor.toString(),
            maxPrincipalMinor: version.maxPrincipalMinor.toString(),
          })),
        },
        context.requestId,
      );
    }

    const input = searchInvestmentsInputSchema.parse({
      q: searchParams.get("q") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      userId: searchParams.get("userId") ?? undefined,
      cursor: searchParams.get("cursor") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    const service = await createAdminFinancialOpsService();
    const result = await service.searchInvestments(input);

    return jsonOk(
      {
        investments: result.rows.map(serializeAdminInvestment),
        nextCursor: result.nextCursor,
      },
      context.requestId,
    );
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}

export async function POST(request: NextRequest) {
  const context = createRequestContext(request);

  try {
    requireSameOrigin(request);
    await requireCsrf(request);
    const input = await parseJson(request, adminCreateInvestmentInputSchema);
    const service = await createAdminFinancialOpsService();
    const result = await service.createInvestmentForCustomer(
      {
        userId: input.userId,
        planVersionId: input.planVersionId,
        principalMinor: input.principalMinor,
        fundShortfall: input.fundShortfall,
        ...(input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : {}),
      },
      createAdminFinancialOpsAuditContext(context),
    );
    await dispatchQueuedEmails(25);

    return jsonOk(
      {
        investment: serializeAdminInvestment(result.investment),
        idempotent: result.idempotent,
      },
      context.requestId,
      { status: 201 },
    );
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
