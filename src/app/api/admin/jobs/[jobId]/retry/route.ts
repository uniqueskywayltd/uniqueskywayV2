import type { NextRequest } from "next/server";

import {
  createRequestContext,
  jsonError,
  jsonOk,
  requireCsrf,
  requireSameOrigin,
} from "@/app/api/_shared/http";

import {
  createAdminSystemAuditContext,
  createAdminSystemService,
} from "../../../_shared/system-service";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ jobId: string }>;
}

export async function POST(request: NextRequest, routeContext: RouteContext) {
  const context = createRequestContext(request);
  try {
    requireSameOrigin(request);
    await requireCsrf(request);
    const { jobId } = await routeContext.params;
    const service = await createAdminSystemService();
    const job = await service.retryJob(jobId, createAdminSystemAuditContext(context));
    return jsonOk({ job }, context.requestId);
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
