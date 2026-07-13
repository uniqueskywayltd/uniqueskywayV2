import type { NextRequest } from "next/server";

import {
  createRequestContext,
  jsonError,
  jsonOk,
  requireCsrf,
  requireSameOrigin,
} from "@/app/api/_shared/http";
import {
  createDepositEngineService,
  createPaymentRouteAuditContext,
  serializeDepositIntent,
} from "@/app/api/payments/_shared/service";

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
    const service = await createDepositEngineService({ withIdentity: true });
    const result = await service.cancelDepositIntent(
      depositId,
      createPaymentRouteAuditContext(context),
    );

    return jsonOk(
      {
        depositIntent: serializeDepositIntent(result.depositIntent),
        idempotent: result.idempotent,
      },
      context.requestId,
    );
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
