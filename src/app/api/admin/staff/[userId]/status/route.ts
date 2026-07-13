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

const statusSchema = z.object({
  status: z.enum(["active", "suspended", "deactivated"]),
  reason: z.string().min(1).optional(),
});

export async function PATCH(request: NextRequest, routeContext: RouteContext) {
  const context = createRequestContext(request);
  try {
    requireSameOrigin(request);
    await requireCsrf(request);
    const { userId } = await routeContext.params;
    const input = await parseJson(request, statusSchema);
    const service = await createAdminSystemService();
    const profile = await service.setStaffStatus(
      userId,
      input,
      createAdminSystemAuditContext(context),
    );
    return jsonOk({ adminProfile: profile }, context.requestId);
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
