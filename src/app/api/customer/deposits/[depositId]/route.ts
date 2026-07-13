import type { NextRequest } from "next/server";

import { createRequestContext, jsonError, jsonOk } from "@/app/api/_shared/http";

import { createCustomerWalletService } from "../../_shared/wallet-service";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ depositId: string }>;
}

export async function GET(request: NextRequest, routeContext: RouteContext) {
  const context = createRequestContext(request);

  try {
    const { depositId } = await routeContext.params;
    const service = await createCustomerWalletService();
    const detail = await service.getDeposit(depositId);
    return jsonOk(detail, context.requestId);
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
