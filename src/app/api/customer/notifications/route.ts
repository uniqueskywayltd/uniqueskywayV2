import type { NextRequest } from "next/server";

import { createRequestContext, jsonError, jsonOk } from "@/app/api/_shared/http";
import { listNotificationsInputSchema } from "@/application/customer";

import { createCustomerExperienceService } from "../_shared/service";

export async function GET(request: NextRequest) {
  const context = createRequestContext(request);

  try {
    const searchParams = request.nextUrl.searchParams;
    const input = listNotificationsInputSchema.parse({
      query: searchParams.get("query") ?? undefined,
      unreadOnly: searchParams.get("unreadOnly") === "true" ? true : undefined,
      category: searchParams.get("category") ?? undefined,
    });
    const service = await createCustomerExperienceService();
    const result = await service.listNotifications(input);
    return jsonOk(result, context.requestId);
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
