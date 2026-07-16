import type { NextRequest } from "next/server";

import {
  createRequestContext,
  jsonError,
  jsonOk,
  parseJson,
  requireCsrf,
  requireSameOrigin,
} from "@/app/api/_shared/http";
import { adminWalletAdjustmentInputSchema } from "@/application/admin";

import {
  createAdminCustomerService,
  createAdminRouteAuditContext,
} from "../../../../_shared/customer-service";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ userId: string }>;
}

export async function POST(request: NextRequest, routeContext: RouteContext) {
  const context = createRequestContext(request);
  try {
    requireSameOrigin(request);
    await requireCsrf(request);
    const { userId } = await routeContext.params;
    const input = await parseJson(request, adminWalletAdjustmentInputSchema);
    const service = await createAdminCustomerService();
    const result = await service.debitWallet(userId, input, createAdminRouteAuditContext(context));
    return jsonOk(result, context.requestId);
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
