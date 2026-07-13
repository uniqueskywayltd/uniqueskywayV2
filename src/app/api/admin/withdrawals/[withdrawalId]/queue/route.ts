import type { NextRequest } from "next/server";

import {
  createRequestContext,
  jsonError,
  jsonOk,
  requireCsrf,
  requireSameOrigin,
} from "@/app/api/_shared/http";
import {
  createPaymentRouteAuditContext,
  createWithdrawalEngineService,
  serializeWithdrawalRequest,
} from "@/app/api/payments/_shared/service";

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
    const service = await createWithdrawalEngineService({ withIdentity: true });
    const result = await service.queueWithdrawalPayout(
      withdrawalId,
      createPaymentRouteAuditContext(context),
    );

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
