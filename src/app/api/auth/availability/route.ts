import type { NextRequest } from "next/server";

import { createRequestContext, jsonError, jsonOk } from "@/app/api/_shared/http";
import { availabilityQuerySchema } from "@/application/auth/schemas";

import { createAuthService } from "../_shared/service";

export async function GET(request: NextRequest) {
  const context = createRequestContext(request);

  try {
    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const input = availabilityQuerySchema.parse(params);
    if (!input.email && !input.username) {
      return jsonOk({ emailAvailable: undefined, usernameAvailable: undefined }, context.requestId);
    }

    const service = await createAuthService();
    const result = await service.checkAvailability({
      ...(input.email ? { email: input.email } : {}),
      ...(input.username ? { username: input.username } : {}),
    });
    return jsonOk(result, context.requestId);
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
