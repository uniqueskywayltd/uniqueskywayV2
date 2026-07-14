import type { AppLanguage } from "./types";

/** Locale-aware money presentation — never mutates magnitude (MULTI_CURRENCY_PRESENTATION_GUIDE). */
export function formatMoneyMinorUnits(
  locale: AppLanguage | string,
  minorUnits: number,
  currency = "USD",
  fractionDigits = 2,
): string {
  const amount = minorUnits / 10 ** fractionDigits;
  return new Intl.NumberFormat(localeForIntl(locale), {
    style: "currency",
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amount);
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
