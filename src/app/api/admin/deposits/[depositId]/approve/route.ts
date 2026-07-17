import type { NextRequest } from "next/server";

import {
  createRequestContext,
  jsonError,
  jsonOk,
  parseJson,
  requireCsrf,
  requireSameOrigin,
} from "@/app/api/_shared/http";
import { dispatchQueuedEmails } from "@/app/api/auth/_shared/dispatch-emails";
import { serializeDepositIntent } from "@/app/api/payments/_shared/service";
import { adminDepositReviewInputSchema } from "@/application/payments";

import {
  createAdminFinancialOpsAuditContext,
  createAdminFinancialOpsService,
} from "../../../_shared/financial-ops-service";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ depositId: string }>;
}

export async function POST(request: NextRequest, routeContext: RouteContext) {
  const context = createRequestContext(request);

  try {
    requireSameOrigin(request);
    await requireCsrf(request);

    const { depositId } = await routeContext.params;
    const input = await parseJson(request, adminDepositReviewInputSchema);
    const service = await createAdminFinancialOpsService();
    const result = await service.approveDeposit(
      depositId,
      input.reason,
      createAdminFinancialOpsAuditContext(context),
    );

    await dispatchQueuedEmails(25);

    return jsonOk(
      {
        depositIntent: serializeDepositIntent(result.depositIntent),
        idempotent: result.idempotent,
        autoInvest: result.autoInvest
          ? {
              investmentId: result.autoInvest.investmentId,
              planSlug: result.autoInvest.planSlug,
              planName: result.autoInvest.planName,
              principalMinor: result.autoInvest.principalMinor,
              status: result.autoInvest.status,
            }
          : null,
      },
      context.requestId,
    );
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
