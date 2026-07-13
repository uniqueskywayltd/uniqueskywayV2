import type { NextRequest } from "next/server";

import {
  createRequestContext,
  jsonError,
  jsonOk,
  requireCsrf,
  requireSameOrigin,
} from "@/app/api/_shared/http";
import { AppError } from "@/application/errors";

import { createAuditContext, createCustomerExperienceService } from "../_shared/service";

export async function POST(request: NextRequest) {
  const context = createRequestContext(request);

  try {
    requireSameOrigin(request);
    await requireCsrf(request);
    const formData = await request.formData();
    const file = formData.get("avatar");

    if (!(file instanceof File)) {
      throw new AppError({ code: "VALIDATION_ERROR", message: "Avatar file is required." });
    }

    const service = await createCustomerExperienceService();
    const result = await service.uploadAvatar(
      {
        body: await file.arrayBuffer(),
        contentType: file.type,
      },
      createAuditContext(context),
    );

    return jsonOk(result, context.requestId);
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
