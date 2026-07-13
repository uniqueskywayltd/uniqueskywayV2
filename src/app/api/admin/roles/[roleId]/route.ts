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
} from "../../_shared/system-service";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ roleId: string }>;
}

const updateRoleSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  description: z.string().max(500).optional(),
  status: z.enum(["active", "disabled"]).optional(),
});

export async function GET(_request: NextRequest, routeContext: RouteContext) {
  const context = createRequestContext(_request);
  try {
    const { roleId } = await routeContext.params;
    const service = await createAdminSystemService();
    const role = await service.getRole(roleId);
    return jsonOk({ role }, context.requestId);
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}

export async function PATCH(request: NextRequest, routeContext: RouteContext) {
  const context = createRequestContext(request);
  try {
    requireSameOrigin(request);
    await requireCsrf(request);
    const { roleId } = await routeContext.params;
    const parsed = await parseJson(request, updateRoleSchema);
    const input: {
      name?: string;
      description?: string;
      status?: string;
    } = {};
    if (parsed.name !== undefined) input.name = parsed.name;
    if (parsed.description !== undefined) input.description = parsed.description;
    if (parsed.status !== undefined) input.status = parsed.status;
    const service = await createAdminSystemService();
    const role = await service.updateRole(roleId, input, createAdminSystemAuditContext(context));
    return jsonOk({ role }, context.requestId);
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}

export async function DELETE(request: NextRequest, routeContext: RouteContext) {
  const context = createRequestContext(request);
  try {
    requireSameOrigin(request);
    await requireCsrf(request);
    const { roleId } = await routeContext.params;
    const service = await createAdminSystemService();
    const result = await service.deleteUnusedRole(roleId, createAdminSystemAuditContext(context));
    return jsonOk(result, context.requestId);
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
