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
import { serializeWithdrawalRequest } from "@/app/api/payments/_shared/service";
import { adminWithdrawalReviewInputSchema } from "@/application/payments";

import {
  createAdminFinancialOpsAuditContext,
  createAdminFinancialOpsService,
} from "../../../_shared/financial-ops-service";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ withdrawalId: string }>;
}

export async function POST(request: NextRequest, routeContext: RouteContext) {
  const context = createRequestContext(request);

  try {
    requireSameOrigin(request);
    await requireCsrf(request);

    const { withdrawalId } = await routeContext.params;
    const input = await parseJson(request, adminWithdrawalReviewInputSchema);
    const service = await createAdminFinancialOpsService();
    const result = await service.approveWithdrawal(
      withdrawalId,
      input.reason,
      createAdminFinancialOpsAuditContext(context),
    );

    await dispatchQueuedEmails(25);

    return jsonOk(
      {
        withdrawal: serializeWithdrawalRequest(result.withdrawal),
        idempotent: result.idempotent,
      },
      context.requestId,
    );
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
