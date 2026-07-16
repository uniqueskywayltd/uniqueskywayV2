import type { NextRequest } from "next/server";

import {
  createRequestContext,
  jsonError,
  jsonOk,
  parseJson,
  requireCsrf,
  requireSameOrigin,
} from "@/app/api/_shared/http";
import { deleteCustomerInputSchema, updateCustomerProfileInputSchema } from "@/application/admin";

import {
  createAdminCustomerService,
  createAdminRouteAuditContext,
  serializeAdminCustomerAccount,
  serializeAdminCustomerProfile,
  serializeAdminUser,
} from "../../_shared/customer-service";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ userId: string }>;
}

export async function GET(request: NextRequest, routeContext: RouteContext) {
  const context = createRequestContext(request);

  try {
    const { userId } = await routeContext.params;
    const service = await createAdminCustomerService();
    const details = await service.getCustomerDetails(userId);

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

export async function PATCH(request: NextRequest, routeContext: RouteContext) {
  const context = createRequestContext(request);

  try {
    requireSameOrigin(request);
    await requireCsrf(request);
    const { userId } = await routeContext.params;
    const input = await parseJson(request, updateCustomerProfileInputSchema);
    const service = await createAdminCustomerService();
    const details = await service.updateCustomerProfile(
      userId,
      input,
      createAdminRouteAuditContext(context),
    );

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

export async function DELETE(request: NextRequest, routeContext: RouteContext) {
  const context = createRequestContext(request);

  try {
    requireSameOrigin(request);
    await requireCsrf(request);
    const { userId } = await routeContext.params;
    const input = await parseJson(request, deleteCustomerInputSchema);
    const service = await createAdminCustomerService();
    const result = await service.deleteCustomer(
      userId,
      input.confirmation,
      createAdminRouteAuditContext(context),
    );
    return jsonOk(result, context.requestId);
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
