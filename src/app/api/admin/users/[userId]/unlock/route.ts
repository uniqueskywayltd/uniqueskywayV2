import type { NextRequest } from "next/server";

import {
  createRequestContext,
  jsonError,
  jsonOk,
  requireCsrf,
  requireSameOrigin,
} from "@/app/api/_shared/http";

import {
  createAdminCustomerService,
  createAdminRouteAuditContext,
  serializeAdminCustomerAccount,
  serializeAdminCustomerProfile,
  serializeAdminUser,
} from "../../../_shared/customer-service";

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
    const service = await createAdminCustomerService();
    const details = await service.unlockCustomer(userId, createAdminRouteAuditContext(context));
    return jsonOk(
      {
        user: serializeAdminUser(details.user),
        profile: serializeAdminCustomerProfile(details.profile),
        account: serializeAdminCustomerAccount(details.account),
      },
      context.requestId,
    );
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
