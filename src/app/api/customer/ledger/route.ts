import type { NextRequest } from "next/server";

import { createRequestContext, jsonError, jsonOk } from "@/app/api/_shared/http";

import { createCustomerWalletService } from "../_shared/wallet-service";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const context = createRequestContext(request);

  try {
    const service = await createCustomerWalletService();
    const ledger = await service.listLedger();
    return jsonOk(ledger, context.requestId);
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
