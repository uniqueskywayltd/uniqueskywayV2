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
import {
  createDepositEngineService,
  createPaymentRouteAuditContext,
  serializeDepositIntent,
  serializeDepositProviderAction,
} from "@/app/api/payments/_shared/service";
import { createDepositIntentInputSchema } from "@/application/payments";
import { AppError } from "@/application/errors";
import { REQUEST_HEADERS } from "@/config/constants";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const context = createRequestContext(request);

  try {
    const service = await createDepositEngineService({ withIdentity: true });
    const depositIntents = await service.listDepositIntents();
    return jsonOk(
      { depositIntents: depositIntents.map(serializeDepositIntent) },
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
        message: "Deposit creation requires an idempotency key.",
      });
    }

    const input = await parseJson(request, createDepositIntentInputSchema);
    const service = await createDepositEngineService({ withIdentity: true });
    const result = await service.createDepositIntent(
      {
        ...input,
        idempotencyKey,
      },
      createPaymentRouteAuditContext(context),
    );

    await dispatchQueuedEmails(25);

    return jsonOk(
      {
        depositIntent: serializeDepositIntent(result.depositIntent),
        providerAction: serializeDepositProviderAction(result.providerAction),
        idempotent: result.idempotent,
      },
      context.requestId,
      { status: result.idempotent ? 200 : 201 },
    );
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
