import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  createRequestContext,
  jsonError,
  parseJson,
  requireCsrf,
  requireSameOrigin,
} from "@/app/api/_shared/http";
import { exportReportInputSchema } from "@/application/admin/reporting-schemas";

import {
  createAdminReportingAuditContext,
  createAdminReportingService,
} from "../../_shared/reporting-service";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const context = createRequestContext(request);
  try {
    requireSameOrigin(request);
    await requireCsrf(request);
    const input = await parseJson(request, exportReportInputSchema);
    const service = await createAdminReportingService();
    const result = await service.exportReport(
      {
        reportKey: input.reportKey,
        format: input.format,
        ...(input.filters ? { filters: input.filters } : {}),
      },
      createAdminReportingAuditContext(context),
    );

    const headers = new Headers({
      "Content-Type": result.contentType,
      "Content-Disposition": `attachment; filename="${result.filename}"`,
      "X-Export-Row-Count": String(result.rowCount),
      "X-Export-Truncated": result.truncated ? "1" : "0",
      "X-Request-Id": context.requestId,
    });

    return new NextResponse(
      typeof result.body === "string" ? result.body : new Uint8Array(result.body),
      { status: 200, headers },
    );
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
