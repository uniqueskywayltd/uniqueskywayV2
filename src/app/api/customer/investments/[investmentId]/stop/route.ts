import type { NextRequest } from "next/server";

import { createRequestContext, jsonError, jsonOk } from "@/app/api/_shared/http";
import { createCustomerPortfolioService } from "@/app/api/customer/_shared/portfolio-service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ investmentId: string }>;
};

/**
 * Customer early exit is retired. These handlers remain only to return a clear
 * business-rule rejection if an outdated client still calls the endpoint.
 */
export async function GET(request: NextRequest, routeContext: RouteContext) {
  const context = createRequestContext(request);

  try {
    const { investmentId } = await routeContext.params;
    const service = await createCustomerPortfolioService();
    const result = await service.previewStopInvestment(investmentId);

    return jsonOk(result, context.requestId);
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}

export async function POST(request: NextRequest, routeContext: RouteContext) {
  const context = createRequestContext(request);

  try {
    const { investmentId } = await routeContext.params;
    const service = await createCustomerPortfolioService();
    const result = await service.stopInvestment(investmentId);

    return jsonOk(result, context.requestId);
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
