import type { NextRequest } from "next/server";

import {
  createRequestContext,
  jsonError,
  jsonOk,
  parseJson,
  requireCsrf,
  requireSameOrigin,
} from "@/app/api/_shared/http";
import { searchCustomersInputSchema, adminCreateCustomerInputSchema } from "@/application/admin";
import { dispatchQueuedEmails } from "@/app/api/auth/_shared/dispatch-emails";

import {
  createAdminCustomerService,
  createAdminRouteAuditContext,
  serializeAdminCustomerAccount,
  serializeAdminCustomerProfile,
  serializeAdminCustomerSearchRow,
  serializeAdminUser,
} from "../_shared/customer-service";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const context = createRequestContext(request);

  try {
    const searchParams = request.nextUrl.searchParams;
    const statusParam = searchParams.get("status") ?? undefined;
    const status = statusParam === "suspended" ? "restricted" : statusParam;

    const input = searchCustomersInputSchema.parse({
      q: searchParams.get("q") ?? undefined,
      status,
      kycStatus: searchParams.get("kycStatus") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      cursor: searchParams.get("cursor") ?? undefined,
    });

    const service = await createAdminCustomerService();
    const result = await service.searchCustomers(input);

    return jsonOk(
      {
        customers: result.rows.map(serializeAdminCustomerSearchRow),
        nextCursor: result.nextCursor,
      },
      context.requestId,
    );
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}

export async function POST(request: NextRequest) {
  const context = createRequestContext(request);

  try {
    requireSameOrigin(request);
    await requireCsrf(request);
    const input = await parseJson(request, adminCreateCustomerInputSchema);
    const service = await createAdminCustomerService();
    const details = await service.createCustomer(input, createAdminRouteAuditContext(context));
    await dispatchQueuedEmails(5);

    return jsonOk(
      {
        user: serializeAdminUser(details.user),
        profile: serializeAdminCustomerProfile(details.profile),
        account: serializeAdminCustomerAccount(details.account),
        temporaryPassword: details.temporaryPassword,
      },
      context.requestId,
    );
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
