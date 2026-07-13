import type { NextRequest } from "next/server";
import { z } from "zod";

import { createRequestContext, jsonError, jsonOk } from "@/app/api/_shared/http";
import { createCustomerPortfolioService } from "@/app/api/customer/_shared/portfolio-service";

export const runtime = "nodejs";

const listQuerySchema = z.object({
  bucket: z.enum(["all", "pending", "active", "completed", "archived"]).optional(),
  q: z.string().trim().max(120).optional(),
  sort: z.enum(["newest", "maturity", "status"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export async function GET(request: NextRequest) {
  const context = createRequestContext(request);

  try {
    const input = listQuerySchema.parse({
      bucket: request.nextUrl.searchParams.get("bucket") ?? undefined,
      q: request.nextUrl.searchParams.get("q") ?? undefined,
      sort: request.nextUrl.searchParams.get("sort") ?? undefined,
      limit: request.nextUrl.searchParams.get("limit") ?? undefined,
    });

    const service = await createCustomerPortfolioService();
    const result = await service.listInvestments({
      ...(input.bucket ? { bucket: input.bucket } : {}),
      ...(input.q ? { q: input.q } : {}),
      ...(input.sort ? { sort: input.sort } : {}),
      ...(input.limit ? { limit: input.limit } : {}),
    });

    return jsonOk(result, context.requestId);
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
