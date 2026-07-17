import { DEFAULT_LANGUAGE, isAppLanguage } from "./language-catalog";
import type { AppLanguage } from "./types";

export interface ResolveLanguageInput {
  savedPreference?: string | null;
  acceptLanguageHeader?: string | null;
  countryHint?: string | null;
  defaultLanguage?: AppLanguage;
}

/**
 * Active site language: saved preference only.
 * Browser / country hints are used for the opt-in suggestion banner — never auto-applied.
 */
export function resolveLanguage(input: ResolveLanguageInput): AppLanguage {
  const fallback = input.defaultLanguage ?? DEFAULT_LANGUAGE;

  if (isAppLanguage(input.savedPreference)) {
    return input.savedPreference;
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
    if (primary && isAppLanguage(primary)) {
      return primary;
    }
  }

  return null;
}

/** Optional geo hint for suggestion UX — never stronger than an explicit preference. */
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
    BE: "fr",
    MA: "ar",
    DZ: "ar",
    EG: "ar",
    SA: "ar",
    AE: "ar",
    IQ: "ar",
    KW: "ar",
    QA: "ar",
    US: "en",
    GB: "en",
    NG: "en",
  };

  return map[normalized] ?? null;
}
