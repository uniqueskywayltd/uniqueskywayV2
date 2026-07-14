import type { AppLanguage } from "./types";

/**
 * Runtime registry kept in sync with LANGUAGE_CATALOG.md.
 * Selector may expose Phase 1 tags during I1 for infrastructure/RTL testing;
 * missing translations fall back to English until a locale reaches pilot/production.
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
    code: "es",
    nativeName: "Español",
    englishName: "Spanish",
    direction: "ltr",
    status: "design",
  },
  {
    code: "fr",
    nativeName: "Français",
    englishName: "French",
    direction: "ltr",
    status: "design",
  },
  {
    code: "ar",
    nativeName: "العربية",
    englishName: "Arabic",
    direction: "rtl",
    status: "design",
  },
  {
    code: "pt",
    nativeName: "Português",
    englishName: "Portuguese",
    direction: "ltr",
    status: "design",
  },
  {
    code: "hi",
    nativeName: "हिन्दी",
    englishName: "Hindi",
    direction: "ltr",
    status: "design",
  },
  {
    code: "bn",
    nativeName: "বাংলা",
    englishName: "Bengali",
    direction: "ltr",
    status: "design",
  },
  {
    code: "zh-Hans",
    nativeName: "简体中文",
    englishName: "Chinese (Simplified)",
    direction: "ltr",
    status: "design",
  },
  {
    code: "ru",
    nativeName: "Русский",
    englishName: "Russian",
    direction: "ltr",
    status: "design",
  },
  {
    code: "ja",
    nativeName: "日本語",
    englishName: "Japanese",
    direction: "ltr",
    status: "design",
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

/** Languages offered in the selector during infrastructure rollout. */
export function listSelectableLanguages() {
  return [...LANGUAGE_CATALOG];
}
