import type { NextRequest } from "next/server";

import {
  createRequestContext,
  jsonError,
  jsonOk,
  parseJson,
  requireCsrf,
  requireSameOrigin,
} from "@/app/api/_shared/http";
import { updateCustomerProfileInputSchema } from "@/application/customer";

import { createAuditContext, createCustomerExperienceService } from "../_shared/service";

export async function PATCH(request: NextRequest) {
  const context = createRequestContext(request);

  try {
    requireSameOrigin(request);
    await requireCsrf(request);
    const input = await parseJson(request, updateCustomerProfileInputSchema);
    const service = await createCustomerExperienceService();
    const profile = await service.updateProfile(input, createAuditContext(context));
    return jsonOk({ profile }, context.requestId);
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
