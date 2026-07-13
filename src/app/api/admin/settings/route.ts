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

const upsertSettingSchema = z.object({
  key: z.string().min(2).max(120),
  value: z.union([z.record(z.string(), z.unknown()), z.string(), z.number(), z.boolean()]),
  description: z.string().max(500).optional(),
});

export async function GET(request: NextRequest) {
  const context = createRequestContext(request);
  try {
    const service = await createAdminSystemService();
    const settings = await service.listSettings();
    return jsonOk({ settings }, context.requestId);
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}

export async function POST(request: NextRequest) {
  const context = createRequestContext(request);
  try {
    requireSameOrigin(request);
    await requireCsrf(request);
    const input = await parseJson(request, upsertSettingSchema);
    const service = await createAdminSystemService();
    const setting = await service.upsertSetting(input, createAdminSystemAuditContext(context));
    return jsonOk({ setting }, context.requestId);
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
