import type { NextRequest } from "next/server";

import { createRequestContext, jsonError, jsonOk } from "@/app/api/_shared/http";
import { createCustomerPortfolioService } from "@/app/api/customer/_shared/portfolio-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ investmentId: string }>;
};

export async function GET(request: NextRequest, routeContext: RouteContext) {
  const context = createRequestContext(request);

  try {
    const { investmentId } = await routeContext.params;
    const service = await createCustomerPortfolioService();
    const result = await service.getInvestment(investmentId);

    return jsonOk(result, context.requestId);
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
