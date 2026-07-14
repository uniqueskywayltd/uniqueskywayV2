import type { NextRequest } from "next/server";

import { createRequestContext, jsonError, jsonOk } from "@/app/api/_shared/http";

import { createCustomerLearningService } from "../../_shared/learning-service";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const requestContext = createRequestContext(request);

  try {
    const { slug } = await context.params;
    const service = await createCustomerLearningService();
    const payload = await service.getLessonDetail(slug);
    return jsonOk(payload, requestContext.requestId);
  } catch (error) {
    return jsonError(error, requestContext.requestId);
  }
}
