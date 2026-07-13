import type { NextRequest } from "next/server";

import { createRequestContext, jsonError, jsonOk } from "@/app/api/_shared/http";

import { createCustomerReferralService } from "../_shared/referral-service";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const context = createRequestContext(request);

  try {
    const service = await createCustomerReferralService();
    const summary = await service.getReferralSummary();
    return jsonOk(summary, context.requestId);
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
