import type { NextRequest } from "next/server";

import {
  createRequestContext,
  jsonError,
  jsonOk,
  parseJson,
  requireCsrf,
  requireSameOrigin,
} from "@/app/api/_shared/http";
import { revokeTrustedDeviceInputSchema } from "@/application/auth";

import { createAuthService } from "../../_shared/service";

export async function POST(request: NextRequest) {
  const context = createRequestContext(request);

  try {
    requireSameOrigin(request);
    await requireCsrf(request);
    const input = await parseJson(request, revokeTrustedDeviceInputSchema);
    const service = await createAuthService();
    const result = await service.revokeTrustedDevice(input.trustedDeviceId, context);
    return jsonOk(result, context.requestId);
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
