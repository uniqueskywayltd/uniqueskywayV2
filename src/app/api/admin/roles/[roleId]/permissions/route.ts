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
  params: Promise<{ roleId: string }>;
}

const setPermissionsSchema = z.object({
  permissionKeys: z.array(z.string().min(1)).default([]),
});

export async function PUT(request: NextRequest, routeContext: RouteContext) {
  const context = createRequestContext(request);
  try {
    requireSameOrigin(request);
    await requireCsrf(request);
    const { roleId } = await routeContext.params;
    const input = await parseJson(request, setPermissionsSchema);
    const service = await createAdminSystemService();
    const result = await service.setRolePermissions(
      roleId,
      input.permissionKeys,
      createAdminSystemAuditContext(context),
    );
    return jsonOk(result, context.requestId);
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
