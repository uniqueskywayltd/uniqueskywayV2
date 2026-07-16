import type { NextRequest } from "next/server";

import {
  createRequestContext,
  jsonError,
  jsonOk,
  parseJson,
  requireCsrf,
  requireSameOrigin,
} from "@/app/api/_shared/http";
import { bulkCustomerActionInputSchema } from "@/application/admin";

import {
  createAdminCustomerService,
  createAdminRouteAuditContext,
} from "../../_shared/customer-service";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const context = createRequestContext(request);

  try {
    requireSameOrigin(request);
    await requireCsrf(request);
    const input = await parseJson(request, bulkCustomerActionInputSchema);
    const service = await createAdminCustomerService();
    const result = await service.bulkCustomerAction(input, createAdminRouteAuditContext(context));
    return jsonOk(result, context.requestId);
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
