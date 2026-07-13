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

const schema = z.object({
  key: z.string().min(2).max(80),
  name: z.string().min(2).max(120),
});

export async function POST(request: NextRequest, routeContext: RouteContext) {
  const context = createRequestContext(request);
  try {
    requireSameOrigin(request);
    await requireCsrf(request);
    const { roleId } = await routeContext.params;
    const input = await parseJson(request, schema);
    const service = await createAdminSystemService();
    const role = await service.cloneRole(roleId, input, createAdminSystemAuditContext(context));
    return jsonOk({ role }, context.requestId, { status: 201 });
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
