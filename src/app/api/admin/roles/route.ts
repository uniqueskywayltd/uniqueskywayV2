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
} from "../_shared/system-service";

export const runtime = "nodejs";

const createRoleSchema = z.object({
  key: z.string().min(2).max(80),
  name: z.string().min(2).max(120),
  description: z.string().max(500).optional(),
  permissionKeys: z.array(z.string()).optional(),
});

export async function GET(request: NextRequest) {
  const context = createRequestContext(request);
  try {
    const service = await createAdminSystemService();
    const roles = await service.listRoles();
    return jsonOk({ roles }, context.requestId);
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}

export async function POST(request: NextRequest) {
  const context = createRequestContext(request);
  try {
    requireSameOrigin(request);
    await requireCsrf(request);
    const input = await parseJson(request, createRoleSchema);
    const service = await createAdminSystemService();
    const role = await service.createRole(input, createAdminSystemAuditContext(context));
    return jsonOk({ role }, context.requestId, { status: 201 });
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
