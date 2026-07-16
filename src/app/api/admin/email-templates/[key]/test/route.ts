import type { NextRequest } from "next/server";
import { z } from "zod";

import { dispatchQueuedEmails } from "@/app/api/auth/_shared/dispatch-emails";
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
  params: Promise<{ key: string }>;
}

const schema = z.object({
  toEmail: z.string().email(),
});

export async function POST(request: NextRequest, routeContext: RouteContext) {
  const context = createRequestContext(request);
  try {
    requireSameOrigin(request);
    await requireCsrf(request);
    const { key } = await routeContext.params;
    const input = await parseJson(request, schema);
    const service = await createAdminSystemService();
    const result = await service.testSendEmailTemplate(
      decodeURIComponent(key),
      input.toEmail,
      createAdminSystemAuditContext(context),
    );
    await dispatchQueuedEmails(25);
    return jsonOk(result, context.requestId);
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
