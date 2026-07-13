import type { NextRequest } from "next/server";

import { createRequestContext, jsonError, jsonOk } from "@/app/api/_shared/http";
import { listProviderEventsInputSchema } from "@/application/admin";

import {
  createAdminFinancialOpsService,
  serializeAdminProviderEvent,
} from "../../_shared/financial-ops-service";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const context = createRequestContext(request);

  try {
    const searchParams = request.nextUrl.searchParams;
    const input = listProviderEventsInputSchema.parse({
      status: searchParams.get("status") ?? undefined,
      deadLettered: searchParams.get("deadLettered") ?? undefined,
      cursor: searchParams.get("cursor") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    const service = await createAdminFinancialOpsService();
    const result = await service.listProviderEvents(input);

    return jsonOk(
      {
        providerEvents: result.rows.map(serializeAdminProviderEvent),
        nextCursor: result.nextCursor,
      },
      context.requestId,
    );
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
