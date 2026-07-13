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
  params: Promise<{ key: string }>;
}

const statusSchema = z.object({
  status: z.enum(["enabled", "disabled"]),
});

export async function GET(request: NextRequest, routeContext: RouteContext) {
  const context = createRequestContext(request);
  try {
    const { key } = await routeContext.params;
    const service = await createAdminSystemService();
    const template = await service.previewEmailTemplate(decodeURIComponent(key));
    return jsonOk({ template }, context.requestId);
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}

export async function PATCH(request: NextRequest, routeContext: RouteContext) {
  const context = createRequestContext(request);
  try {
    requireSameOrigin(request);
    await requireCsrf(request);
    const { key } = await routeContext.params;
    const input = await parseJson(request, statusSchema);
    const service = await createAdminSystemService();
    const template = await service.setEmailTemplateStatus(
      decodeURIComponent(key),
      input.status,
      createAdminSystemAuditContext(context),
    );
    return jsonOk({ template }, context.requestId);
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
