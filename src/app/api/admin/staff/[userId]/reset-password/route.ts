import type { NextRequest } from "next/server";

import { dispatchQueuedEmails } from "@/app/api/auth/_shared/dispatch-emails";
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
  params: Promise<{ userId: string }>;
}

export async function POST(request: NextRequest, routeContext: RouteContext) {
  const context = createRequestContext(request);
  try {
    requireSameOrigin(request);
    await requireCsrf(request);
    const { userId } = await routeContext.params;
    const service = await createAdminSystemService();
    const result = await service.resetStaffPassword(userId, createAdminSystemAuditContext(context));
    await dispatchQueuedEmails(25);
    return jsonOk(result, context.requestId);
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
