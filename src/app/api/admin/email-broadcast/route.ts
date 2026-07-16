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

import { createAdminSystemAuditContext, createAdminSystemService } from "../_shared/system-service";

export const runtime = "nodejs";

const schema = z.object({
  toEmail: z.string().email(),
  title: z.string().trim().min(3).max(200),
  body: z.string().trim().min(3).max(5000),
  recipientUserId: z.string().uuid().optional().nullable(),
});

export async function POST(request: NextRequest) {
  const context = createRequestContext(request);
  try {
    requireSameOrigin(request);
    await requireCsrf(request);
    const input = await parseJson(request, schema);
    const service = await createAdminSystemService();
    const result = await service.queueBroadcastEmail(
      {
        toEmail: input.toEmail,
        title: input.title,
        body: input.body,
        recipientUserId: input.recipientUserId ?? null,
      },
      createAdminSystemAuditContext(context),
    );
    return jsonOk(result, context.requestId);
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
