import type { NextRequest } from "next/server";

import { createRequestContext, jsonError, jsonOk } from "@/app/api/_shared/http";

import { createAdminReportingService } from "../../_shared/reporting-service";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const context = createRequestContext(request);
  try {
    const service = await createAdminReportingService();
    const dashboard = await service.getExecutiveDashboard();
    return jsonOk({ dashboard }, context.requestId);
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
