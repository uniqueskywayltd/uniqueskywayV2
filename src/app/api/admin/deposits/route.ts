import type { NextRequest } from "next/server";
import { z } from "zod";

import { createRequestContext, jsonError, jsonOk } from "@/app/api/_shared/http";
import {
  createDepositEngineService,
  serializeDepositIntent,
} from "@/app/api/payments/_shared/service";

export const runtime = "nodejs";

const depositStatusQuerySchema = z
  .enum(["created", "pending", "confirmed", "failed", "cancelled", "reversed"])
  .optional();

export async function GET(request: NextRequest) {
  const context = createRequestContext(request);

  try {
    const statusParam = request.nextUrl.searchParams.get("status") ?? undefined;
    const status = depositStatusQuerySchema.parse(statusParam);
    const service = await createDepositEngineService({ withIdentity: true });
    const depositIntents = await service.listAllDepositIntents(status);
    return jsonOk(
      { depositIntents: depositIntents.map(serializeDepositIntent) },
      context.requestId,
    );
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
