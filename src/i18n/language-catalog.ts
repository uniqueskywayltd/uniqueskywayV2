import type { AppLanguage } from "./types";

/**
 * Customer-facing language catalog.
 * Admin remains English-only and does not offer a selector.
 */
export const LANGUAGE_CATALOG = [
  {
    code: "en",
    nativeName: "English",
    englishName: "English",
    direction: "ltr",
    status: "production",
  },
  {
    code: "ar",
    nativeName: "العربية",
    englishName: "Arabic",
    direction: "rtl",
    status: "production",
  },
  {
    code: "es",
    nativeName: "Español",
    englishName: "Spanish",
    direction: "ltr",
    status: "production",
  },
  {
    code: "fr",
    nativeName: "Français",
    englishName: "French",
    direction: "ltr",
    status: "production",
  },
] as const satisfies ReadonlyArray<{
  code: AppLanguage;
  nativeName: string;
  englishName: string;
  direction: "ltr" | "rtl";
  status: "design" | "pilot" | "production" | "retired";
}>;

export const DEFAULT_LANGUAGE: AppLanguage = "en";

export const APP_LANGUAGES = LANGUAGE_CATALOG.map((entry) => entry.code);

export function isAppLanguage(value: string | null | undefined): value is AppLanguage {
  return Boolean(value && (APP_LANGUAGES as readonly string[]).includes(value));
}

export function getLanguageEntry(code: AppLanguage) {
  const entry = LANGUAGE_CATALOG.find((item) => item.code === code);
  if (!entry) {
    throw new Error(`Unknown language: ${code}`);
  }
  return entry;
}

export function getLanguageDirection(code: AppLanguage): "ltr" | "rtl" {
  return getLanguageEntry(code).direction;
}

/** Languages offered in the customer language selector. */
export function listSelectableLanguages() {
  return [...LANGUAGE_CATALOG];
}
