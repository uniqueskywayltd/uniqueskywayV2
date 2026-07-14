import { z } from "zod";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  createRequestContext,
  jsonError,
  jsonOk,
  parseJson,
  requireCsrf,
  requireSameOrigin,
} from "@/app/api/_shared/http";
import { APP_LANGUAGE_CODES, LANGUAGE_COOKIE_NAME, isAppLanguage } from "@/i18n";
import { getServerEnv } from "@/config/server-env";

import { createAuditContext, createCustomerExperienceService } from "../customer/_shared/service";

const setLocaleSchema = z.object({
  language: z.enum(APP_LANGUAGE_CODES),
});

export async function POST(request: NextRequest) {
  const context = createRequestContext(request);

  try {
    requireSameOrigin(request);
    await requireCsrf(request);
    const input = await parseJson(request, setLocaleSchema);
    if (!isAppLanguage(input.language)) {
      throw new Error("Unsupported language.");
    }

    let persistedToProfile = false;
    try {
      const service = await createCustomerExperienceService();
      await service.updatePreferences({ language: input.language }, createAuditContext(context));
      persistedToProfile = true;
    } catch {
      // Guests and unauthenticated sessions keep cookie-only preference.
      persistedToProfile = false;
    }

    const response = jsonOk(
      { language: input.language, persistedToProfile },
      context.requestId,
    );
    setLanguageCookie(response, input.language);
    return response;
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}

function setLanguageCookie(response: NextResponse, language: string) {
  const env = getServerEnv();
  response.cookies.set(LANGUAGE_COOKIE_NAME, language, {
    httpOnly: false,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}
