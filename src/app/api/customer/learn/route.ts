import type { NextRequest } from "next/server";

import { createRequestContext, jsonError, jsonOk } from "@/app/api/_shared/http";
import type { LearningPathId } from "@/application/customer/learning-catalog";

import { createCustomerLearningService } from "../_shared/learning-service";

export const runtime = "nodejs";

const PATH_IDS = new Set<LearningPathId>([
  "getting-started",
  "investments",
  "wallet-transfers",
  "security",
  "statements",
  "referrals",
]);

export async function GET(request: NextRequest) {
  const context = createRequestContext(request);

  try {
    const q = request.nextUrl.searchParams.get("q") ?? undefined;
    const pathParam = request.nextUrl.searchParams.get("path") ?? "all";
    const pathId =
      pathParam !== "all" && PATH_IDS.has(pathParam as LearningPathId)
        ? (pathParam as LearningPathId)
        : "all";

    const service = await createCustomerLearningService();
    const payload = await service.getLearnHome({
      ...(q ? { q } : {}),
      pathId,
    });
    return jsonOk(payload, context.requestId);
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
