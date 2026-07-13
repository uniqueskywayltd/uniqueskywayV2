import type { NextRequest } from "next/server";

import { createRequestContext, jsonError, jsonOk } from "@/app/api/_shared/http";
import { operationalReportKindSchema } from "@/application/admin/reporting-schemas";

import { createAdminReportingService } from "../../_shared/reporting-service";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const context = createRequestContext(request);
  try {
    const kind = operationalReportKindSchema.parse(
      request.nextUrl.searchParams.get("kind") ?? "jobs",
    );
    const service = await createAdminReportingService();
    const report = await service.getOperationalReport(kind);
    return jsonOk({ report }, context.requestId);
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
