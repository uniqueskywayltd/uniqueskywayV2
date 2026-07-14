import { cookies, headers } from "next/headers";

import { getLanguageDirection, isAppLanguage } from "./language-catalog";
import { resolveLanguage } from "./resolve-language";
import { LANGUAGE_COOKIE_NAME, type AppLanguage } from "./types";

export async function getRequestLanguage(): Promise<{
  language: AppLanguage;
  direction: "ltr" | "rtl";
}> {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const language = resolveLanguage({
    savedPreference: cookieStore.get(LANGUAGE_COOKIE_NAME)?.value ?? null,
    acceptLanguageHeader: headerStore.get("accept-language"),
  });

  return {
    language,
    direction: getLanguageDirection(language),
  };
}

export function readLanguageCookieValue(value: string | undefined): AppLanguage | null {
  return isAppLanguage(value) ? value : null;
}
