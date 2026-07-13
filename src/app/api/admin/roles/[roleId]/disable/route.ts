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
  params: Promise<{ roleId: string }>;
}

export async function POST(request: NextRequest, routeContext: RouteContext) {
  const context = createRequestContext(request);
  try {
    requireSameOrigin(request);
    await requireCsrf(request);
    const { roleId } = await routeContext.params;
    const service = await createAdminSystemService();
    const role = await service.disableRole(roleId, createAdminSystemAuditContext(context));
    return jsonOk({ role }, context.requestId);
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
