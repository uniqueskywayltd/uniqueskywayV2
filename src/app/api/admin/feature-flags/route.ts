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

const upsertFlagSchema = z.object({
  key: z.string().min(2).max(120),
  status: z.enum(["enabled", "disabled"]),
  description: z.string().max(500).optional(),
  rolloutPercent: z.number().int().min(0).max(100).optional(),
  internalOnly: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  const context = createRequestContext(request);
  try {
    const service = await createAdminSystemService();
    const featureFlags = await service.listFeatureFlags();
    return jsonOk({ featureFlags }, context.requestId);
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}

export async function POST(request: NextRequest) {
  const context = createRequestContext(request);
  try {
    requireSameOrigin(request);
    await requireCsrf(request);
    const input = await parseJson(request, upsertFlagSchema);
    const service = await createAdminSystemService();
    const featureFlag = await service.upsertFeatureFlag(
      input,
      createAdminSystemAuditContext(context),
    );
    return jsonOk({ featureFlag }, context.requestId, { status: 201 });
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
