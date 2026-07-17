import type { AppLanguage } from "./types";
import {
  formatMoneyMinorUnits as formatMoneyMinorUnitsShared,
  formatUsdFromMinor as formatUsdFromMinorShared,
} from "@/lib/money-format";

/** Locale-aware money presentation — never mutates magnitude (MULTI_CURRENCY_PRESENTATION_GUIDE). */
export function formatMoneyMinorUnits(
  locale: AppLanguage | string,
  minorUnits: number | string | bigint,
  currency = "USD",
  fractionDigits = 2,
): string {
  return formatMoneyMinorUnitsShared(locale, minorUnits, currency, fractionDigits);
}

export function formatUsdFromMinor(
  amountMinor: string | number | bigint | null | undefined,
): string {
  return formatUsdFromMinorShared(amountMinor, "en");
}

export function formatDateTime(locale: AppLanguage | string, iso: string, timeZone?: string) {
  return new Intl.DateTimeFormat(localeForIntl(locale), {
    dateStyle: "medium",
    timeStyle: "short",
    ...(timeZone ? { timeZone } : {}),
  }).format(new Date(iso));
}

function localeForIntl(locale: string): string {
  if (locale === "zh-Hans") return "zh-CN";
  return locale;
}
