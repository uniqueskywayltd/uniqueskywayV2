import type { NextRequest } from "next/server";

import { createRequestContext, jsonError, jsonOk } from "@/app/api/_shared/http";

import { createAdminFinancialOpsService } from "../_shared/financial-ops-service";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const context = createRequestContext(request);

  try {
    const service = await createAdminFinancialOpsService();
    const snapshot = await service.getMonitoringSnapshot();

    return jsonOk(snapshot, context.requestId);
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
