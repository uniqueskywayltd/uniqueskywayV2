import type { NextRequest } from "next/server";

import { createRequestContext, jsonError, jsonOk } from "@/app/api/_shared/http";
import {
  customerReportKindSchema,
  reportFilterQuerySchema,
} from "@/application/admin/reporting-schemas";

import { createAdminReportingService } from "../../_shared/reporting-service";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const context = createRequestContext(request);
  try {
    const kind = customerReportKindSchema.parse(request.nextUrl.searchParams.get("kind") ?? "growth");
    const parsed = reportFilterQuerySchema.parse({
      from: request.nextUrl.searchParams.get("from") ?? undefined,
      to: request.nextUrl.searchParams.get("to") ?? undefined,
      status: request.nextUrl.searchParams.get("status") ?? undefined,
      customerId: request.nextUrl.searchParams.get("customerId") ?? undefined,
      investmentId: request.nextUrl.searchParams.get("investmentId") ?? undefined,
      reference: request.nextUrl.searchParams.get("reference") ?? undefined,
      q: request.nextUrl.searchParams.get("q") ?? undefined,
      limit: request.nextUrl.searchParams.get("limit") ?? undefined,
    });
    const filters: Record<string, string | number> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (value !== undefined) filters[key] = value;
    }
    const service = await createAdminReportingService();
    const report = await service.getCustomerReport(kind, filters);
    return jsonOk({ report }, context.requestId);
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
