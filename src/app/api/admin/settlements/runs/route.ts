import type { NextRequest } from "next/server";

import { createRequestContext, jsonError, jsonOk } from "@/app/api/_shared/http";
import { listSettlementRunsInputSchema } from "@/application/admin";

import {
  createAdminFinancialOpsService,
  serializeAdminSettlementRun,
} from "../../_shared/financial-ops-service";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const context = createRequestContext(request);

  try {
    const searchParams = request.nextUrl.searchParams;
    const input = listSettlementRunsInputSchema.parse({
      status: searchParams.get("status") ?? undefined,
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
      cursor: searchParams.get("cursor") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    const service = await createAdminFinancialOpsService();
    const result = await service.listSettlementRuns(input);

    return jsonOk(
      {
        runs: result.rows.map(serializeAdminSettlementRun),
        nextCursor: result.nextCursor,
      },
      context.requestId,
    );
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
