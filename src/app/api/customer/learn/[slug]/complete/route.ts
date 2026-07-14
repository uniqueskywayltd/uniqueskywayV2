import type { NextRequest } from "next/server";

import { createRequestContext, jsonError, jsonOk, requireCsrf } from "@/app/api/_shared/http";
import { createAuditContext } from "@/app/api/customer/_shared/service";

import { createCustomerLearningService } from "../../../_shared/learning-service";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const requestContext = createRequestContext(request);

  try {
    await requireCsrf(request);
    const { slug } = await context.params;
    const service = await createCustomerLearningService();
    const payload = await service.markLessonComplete(slug, createAuditContext(requestContext));
    return jsonOk(payload, requestContext.requestId);
  } catch (error) {
    return jsonError(error, requestContext.requestId);
  }
}
