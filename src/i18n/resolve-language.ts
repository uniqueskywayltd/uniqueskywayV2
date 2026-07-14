import { DEFAULT_LANGUAGE, isAppLanguage } from "./language-catalog";
import type { AppLanguage } from "./types";

export interface ResolveLanguageInput {
  savedPreference?: string | null;
  acceptLanguageHeader?: string | null;
  countryHint?: string | null;
  defaultLanguage?: AppLanguage;
}

/**
 * Priority (DEC-0060): saved preference → browser → optional country → English.
 * Never invent unsupported tags.
 */
export function resolveLanguage(input: ResolveLanguageInput): AppLanguage {
  const fallback = input.defaultLanguage ?? DEFAULT_LANGUAGE;

  if (isAppLanguage(input.savedPreference)) {
    return input.savedPreference;
  }

  const fromBrowser = firstSupportedFromAcceptLanguage(input.acceptLanguageHeader);
  if (fromBrowser) {
    return fromBrowser;
  }

  const fromCountry = languageFromCountryHint(input.countryHint);
  if (fromCountry) {
    return fromCountry;
  }

  return fallback;
}

export function firstSupportedFromAcceptLanguage(
  header: string | null | undefined,
): AppLanguage | null {
  if (!header) return null;

  const candidates = header
    .split(",")
    .map((part) => part.trim().split(";")[0]?.trim())
    .filter(Boolean) as string[];

  for (const candidate of candidates) {
    if (isAppLanguage(candidate)) {
      return candidate;
    }

    const primary = candidate.split("-")[0]?.toLowerCase();
    if (primary === "zh") {
      // Default Simplified for Phase 1 when script/region omitted.
      if (isAppLanguage("zh-Hans")) return "zh-Hans";
    }
    if (primary && isAppLanguage(primary)) {
      return primary;
    }
  }

  return null;
}

/** Optional, never stronger than preference or browser (DEC-0060). */
export function languageFromCountryHint(country: string | null | undefined): AppLanguage | null {
  if (!country) return null;
  const normalized = country.trim().toUpperCase();

  const map: Record<string, AppLanguage> = {
    ES: "es",
    MX: "es",
    AR: "es",
    CO: "es",
    CL: "es",
    PE: "es",
    FR: "fr",
    SN: "fr",
    CI: "fr",
    CM: "fr",
    MA: "fr",
    DZ: "ar",
    EG: "ar",
    SA: "ar",
    AE: "ar",
    IQ: "ar",
    BR: "pt",
    PT: "pt",
    IN: "hi",
    BD: "bn",
    CN: "zh-Hans",
    SG: "zh-Hans",
    RU: "ru",
    JP: "ja",
    US: "en",
    GB: "en",
    NG: "en",
  };

  return map[normalized] ?? null;
}
