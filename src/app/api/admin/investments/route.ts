import type { NextRequest } from "next/server";

import { createRequestContext, jsonError, jsonOk } from "@/app/api/_shared/http";
import { searchInvestmentsInputSchema } from "@/application/admin";

import {
  createAdminFinancialOpsService,
  serializeAdminInvestment,
} from "../_shared/financial-ops-service";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const context = createRequestContext(request);

  try {
    const searchParams = request.nextUrl.searchParams;
    const input = searchInvestmentsInputSchema.parse({
      q: searchParams.get("q") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      userId: searchParams.get("userId") ?? undefined,
      cursor: searchParams.get("cursor") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    const service = await createAdminFinancialOpsService();
    const result = await service.searchInvestments(input);

    return jsonOk(
      {
        investments: result.rows.map(serializeAdminInvestment),
        nextCursor: result.nextCursor,
      },
      context.requestId,
    );
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
