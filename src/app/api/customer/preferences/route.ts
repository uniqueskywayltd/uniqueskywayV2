import type { NextRequest } from "next/server";

import {
  createRequestContext,
  jsonError,
  jsonOk,
  parseJson,
  requireCsrf,
  requireSameOrigin,
} from "@/app/api/_shared/http";
import { updateCustomerPreferencesInputSchema } from "@/application/customer";

import { createAuditContext, createCustomerExperienceService } from "../_shared/service";

export async function PATCH(request: NextRequest) {
  const context = createRequestContext(request);

  try {
    requireSameOrigin(request);
    await requireCsrf(request);
    const input = await parseJson(request, updateCustomerPreferencesInputSchema);
    const service = await createCustomerExperienceService();
    const result = await service.updatePreferences(input, createAuditContext(context));
    return jsonOk(result, context.requestId);
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
