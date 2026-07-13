import type { NextRequest } from "next/server";

import { createRequestContext, jsonError, jsonOk } from "@/app/api/_shared/http";
import { serializeWithdrawalRequest } from "@/app/api/payments/_shared/service";
import { searchWithdrawalsInputSchema } from "@/application/admin";

import { createAdminFinancialOpsService } from "../_shared/financial-ops-service";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const context = createRequestContext(request);

  try {
    const searchParams = request.nextUrl.searchParams;
    const input = searchWithdrawalsInputSchema.parse({
      q: searchParams.get("q") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      userId: searchParams.get("userId") ?? undefined,
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
      cursor: searchParams.get("cursor") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    const service = await createAdminFinancialOpsService();
    const result = await service.searchWithdrawals(input);

    return jsonOk(
      {
        withdrawals: result.rows.map(serializeWithdrawalRequest),
        nextCursor: result.nextCursor,
      },
      context.requestId,
    );
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
