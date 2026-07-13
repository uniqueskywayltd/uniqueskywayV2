import type { NextRequest } from "next/server";
import { z } from "zod";

import {
  createRequestContext,
  jsonError,
  jsonOk,
  parseJson,
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

const schema = z.object({
  reason: z.string().min(1).max(500),
});

export async function POST(request: NextRequest, routeContext: RouteContext) {
  const context = createRequestContext(request);
  try {
    requireSameOrigin(request);
    await requireCsrf(request);
    const { userId } = await routeContext.params;
    const input = await parseJson(request, schema);
    const service = await createAdminSystemService();
    const adminProfile = await service.lockStaffAccount(
      userId,
      input.reason,
      createAdminSystemAuditContext(context),
    );
    return jsonOk({ adminProfile }, context.requestId);
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
