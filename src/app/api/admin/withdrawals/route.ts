import type { NextRequest } from "next/server";
import { z } from "zod";

import { createRequestContext, jsonError, jsonOk } from "@/app/api/_shared/http";
import {
  createWithdrawalEngineService,
  serializeWithdrawalRequest,
} from "@/app/api/payments/_shared/service";

export const runtime = "nodejs";

const withdrawalStatusQuerySchema = z
  .enum([
    "requested",
    "reserved",
    "under_review",
    "approved",
    "processing",
    "paid",
    "rejected",
    "failed",
    "cancelled",
  ])
  .optional();

export async function GET(request: NextRequest) {
  const context = createRequestContext(request);

  try {
    const statusParam = request.nextUrl.searchParams.get("status") ?? undefined;
    const status = withdrawalStatusQuerySchema.parse(statusParam);
    const service = await createWithdrawalEngineService({ withIdentity: true });
    const withdrawals = await service.listWithdrawalsForAdmin(status);
    return jsonOk(
      { withdrawals: withdrawals.map(serializeWithdrawalRequest) },
      context.requestId,
    );
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
