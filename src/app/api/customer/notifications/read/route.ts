import type { NextRequest } from "next/server";

import {
  createRequestContext,
  jsonError,
  jsonOk,
  parseJson,
  requireCsrf,
  requireSameOrigin,
} from "@/app/api/_shared/http";
import { markNotificationReadInputSchema } from "@/application/customer";

import { createAuditContext, createCustomerExperienceService } from "../../_shared/service";

export async function POST(request: NextRequest) {
  const context = createRequestContext(request);

  try {
    requireSameOrigin(request);
    await requireCsrf(request);
    const input = await parseJson(request, markNotificationReadInputSchema);
    const service = await createCustomerExperienceService();
    const notification = await service.markNotificationRead(
      input,
      createAuditContext(context),
    );
    return jsonOk(notification, context.requestId);
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
