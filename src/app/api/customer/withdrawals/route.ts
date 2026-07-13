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
  createPaymentRouteAuditContext,
  createWithdrawalEngineService,
  serializeWithdrawalRequest,
} from "@/app/api/payments/_shared/service";
import { createWithdrawalRequestInputSchema } from "@/application/payments";
import { AppError } from "@/application/errors";
import { REQUEST_HEADERS } from "@/config/constants";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const context = createRequestContext(request);

  try {
    const service = await createWithdrawalEngineService({ withIdentity: true });
    const withdrawals = await service.listWithdrawals();
    return jsonOk(
      { withdrawals: withdrawals.map(serializeWithdrawalRequest) },
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

    const idempotencyKey = request.headers.get(REQUEST_HEADERS.idempotencyKey);
    if (!idempotencyKey) {
      throw new AppError({
        code: "IDEMPOTENCY_ERROR",
        message: "Withdrawal creation requires an idempotency key.",
      });
    }

    const input = await parseJson(request, createWithdrawalRequestInputSchema);
    const service = await createWithdrawalEngineService({ withIdentity: true });
    const result = await service.createWithdrawalRequest(
      {
        ...input,
        idempotencyKey,
      },
      createPaymentRouteAuditContext(context),
    );

    return jsonOk(
      {
        withdrawal: serializeWithdrawalRequest(result.withdrawal),
        idempotent: result.idempotent,
      },
      context.requestId,
      { status: result.idempotent ? 200 : 201 },
    );
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
