import type { NextRequest } from "next/server";

import { createRequestContext, jsonError, jsonOk } from "@/app/api/_shared/http";
import { searchCustomersInputSchema } from "@/application/admin";

import { createAdminCustomerService, serializeAdminCustomerSearchRow } from "../_shared/customer-service";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const context = createRequestContext(request);

  try {
    const searchParams = request.nextUrl.searchParams;
    const input = searchCustomersInputSchema.parse({
      q: searchParams.get("q") ?? undefined,
      status: searchParams.get("status") ?? undefined,
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
