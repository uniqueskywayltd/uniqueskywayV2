import type { NextRequest } from "next/server";

import { createRequestContext, jsonError, jsonOk } from "@/app/api/_shared/http";

import { createCustomerExperienceService } from "../_shared/service";

export async function GET(request: NextRequest) {
  const context = createRequestContext(request);

  try {
    const service = await createCustomerExperienceService();
    const activity = await service.listActivity();
    return jsonOk({ activity }, context.requestId);
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
