import type { NextRequest } from "next/server";

import { createRequestContext, jsonError, jsonOk } from "@/app/api/_shared/http";
import { listBackgroundJobsInputSchema } from "@/application/admin";

import {
  createAdminFinancialOpsService,
  serializeAdminBackgroundJob,
} from "../../_shared/financial-ops-service";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const context = createRequestContext(request);

  try {
    const searchParams = request.nextUrl.searchParams;
    const input = listBackgroundJobsInputSchema.parse({
      status: searchParams.get("status") ?? undefined,
      jobType: searchParams.get("jobType") ?? undefined,
      cursor: searchParams.get("cursor") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    const service = await createAdminFinancialOpsService();
    const result = await service.listBackgroundJobs(input);

    return jsonOk(
      {
        jobs: result.rows.map(serializeAdminBackgroundJob),
        nextCursor: result.nextCursor,
      },
      context.requestId,
    );
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
