import type { NextRequest } from "next/server";
import { z } from "zod";

import {
  createRequestContext,
  jsonError,
  jsonOk,
  parseJson,
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

const lockSchema = z.object({
  reason: z.string().trim().min(1).max(500),
});

export async function POST(request: NextRequest, routeContext: RouteContext) {
  const context = createRequestContext(request);
  try {
    requireSameOrigin(request);
    await requireCsrf(request);
    const { userId } = await routeContext.params;
    const input = await parseJson(request, lockSchema);
    const service = await createAdminCustomerService();
    const details = await service.lockCustomer(
      userId,
      input.reason,
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
