import type { NextRequest } from "next/server";

import { createRequestContext, jsonError, jsonOk } from "@/app/api/_shared/http";

import {
  createAdminCustomerService,
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
