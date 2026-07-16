import type { NextRequest } from "next/server";
import { z } from "zod";

import {
  createRequestContext,
  jsonError,
  jsonOk,
  parseJson,
  requireCsrf,
  requireSameOrigin,
} from "@/app/api/_shared/http";
import { createCustomerPortfolioService } from "@/app/api/customer/_shared/portfolio-service";
import { dispatchQueuedEmails } from "@/app/api/auth/_shared/dispatch-emails";

export const runtime = "nodejs";

const listQuerySchema = z.object({
  bucket: z.enum(["all", "pending", "active", "completed", "archived"]).optional(),
  q: z.string().trim().max(120).optional(),
  sort: z.enum(["newest", "maturity", "status"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

const activateInputSchema = z.object({
  planVersionId: z.string().uuid(),
  principalMinor: z
    .union([
      z.bigint(),
      z.number().int().positive(),
      z.string().regex(/^[1-9]\d*$/, "Amount must be a positive integer minor-unit value."),
    ])
    .transform((value) => BigInt(value))
    .refine((value) => value > 0n, {
      message: "Principal must be greater than zero.",
    }),
  idempotencyKey: z.string().trim().min(8).max(180),
});

export async function GET(request: NextRequest) {
  const context = createRequestContext(request);

  try {
    const catalog = request.nextUrl.searchParams.get("catalog");
    const service = await createCustomerPortfolioService();

    if (catalog === "plans") {
      const result = await service.listPublishedPlans();
      return jsonOk(result, context.requestId);
    }

    const input = listQuerySchema.parse({
      bucket: request.nextUrl.searchParams.get("bucket") ?? undefined,
      q: request.nextUrl.searchParams.get("q") ?? undefined,
      sort: request.nextUrl.searchParams.get("sort") ?? undefined,
      limit: request.nextUrl.searchParams.get("limit") ?? undefined,
    });

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

export async function POST(request: NextRequest) {
  const context = createRequestContext(request);

  try {
    requireSameOrigin(request);
    await requireCsrf(request);
    const input = await parseJson(request, activateInputSchema);
    const service = await createCustomerPortfolioService();
    const result = await service.activateInvestment(input);
    await dispatchQueuedEmails(25);
    return jsonOk(result, context.requestId, { status: 201 });
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
