import type { NextRequest } from "next/server";

import {
  createRequestContext,
  jsonError,
  jsonOk,
  requireCsrf,
  requireSameOrigin,
} from "@/app/api/_shared/http";
import { verifyEmailInputSchema, verifyEmailLinkInputSchema } from "@/application/auth/schemas";

import { dispatchQueuedEmails } from "../_shared/dispatch-emails";
import { createAuthService } from "../_shared/service";

export async function POST(request: NextRequest) {
  const context = createRequestContext(request);

  try {
    requireSameOrigin(request);
    await requireCsrf(request);
    const body = (await request.json()) as Record<string, unknown>;
    const isLinkPayload = "tokenHash" in body || "token_hash" in body;

    if (isLinkPayload) {
      const input = verifyEmailLinkInputSchema.parse({
        ...body,
        tokenHash:
          typeof body.tokenHash === "string"
            ? body.tokenHash
            : typeof body.token_hash === "string"
              ? body.token_hash
              : undefined,
      });
      const service = await createAuthService({ rememberSession: input.rememberMe });
      const result = await service.verifyEmailLink(input, context);
      await dispatchQueuedEmails(25);
      return jsonOk(result, context.requestId);
    }

    const input = verifyEmailInputSchema.parse(body);
    const service = await createAuthService({ rememberSession: input.rememberMe });
    const result = await service.verifyEmail(input, context);
    await dispatchQueuedEmails(25);
    return jsonOk(result, context.requestId);
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
