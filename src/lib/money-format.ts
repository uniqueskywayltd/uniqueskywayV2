/**
 * Single shared money formatting utility for the entire platform.
 * Display / input / export only — never mutates ledger magnitudes or calculations.
 */

export type MoneyLocale = string;

const DEFAULT_LOCALE = "en-US";

const CRYPTO_FRACTION_DIGITS: Record<string, number> = {
  BTC: 8,
  ETH: 8,
  USDT: 6,
};

const FIAT_CURRENCIES = new Set(["USD", "EUR", "GBP", "CAD", "AUD", "NGN"]);

/** Keys that store integer minor units (cents for USD). */
const MINOR_KEY_PATTERN =
  /(^|_)(amount|principal|balance|credit|debit|roi|reward|penalty|commission|value|total|net|posted|reserved|available|pending|locked|withdrawable|deposits|withdrawals).*minor$/i;

function localeForIntl(locale: string): string {
  if (locale === "zh-Hans") return "zh-CN";
  if (locale === "en") return "en-US";
  return locale;
}

function toFiniteNumber(value: string | number | bigint | null | undefined): number | null {
  if (value == null) return null;
  if (typeof value === "bigint") {
    const asNumber = Number(value);
    return Number.isFinite(asNumber) ? asNumber : null;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  const trimmed = value.trim();
  if (!trimmed) return null;
  const asNumber = Number(trimmed);
  return Number.isFinite(asNumber) ? asNumber : null;
}

export function isCryptoCurrency(currency: string): boolean {
  return Object.prototype.hasOwnProperty.call(CRYPTO_FRACTION_DIGITS, currency.toUpperCase());
}

export function cryptoFractionDigits(currency: string): number {
  return CRYPTO_FRACTION_DIGITS[currency.toUpperCase()] ?? 8;
}

export function isMoneyMinorFieldKey(key: string): boolean {
  const normalized = key.replace(/[^a-zA-Z0-9]/g, "");
  if (/microMinor/i.test(normalized)) return false;
  return MINOR_KEY_PATTERN.test(normalized) || /Minor$/i.test(key);
}

/**
 * Format ledger / cash amounts stored as integer minor units (USD cents by default).
 * Example: 5000000 → "$50,000.00"
 */
export function formatMoneyMinorUnits(
  locale: MoneyLocale,
  minorUnits: string | number | bigint | null | undefined,
  currency = "USD",
  fractionDigits = 2,
): string {
  const minor = toFiniteNumber(minorUnits);
  if (minor == null) return formatMoneyMajor(locale, 0, currency, fractionDigits);

  const code = currency.toUpperCase();
  if (isCryptoCurrency(code)) {
    const digits = fractionDigits !== 2 ? fractionDigits : cryptoFractionDigits(code);
    const major = minor / 10 ** digits;
    return formatCryptoAmount(major, code, digits);
  }

  const major = minor / 10 ** fractionDigits;
  return formatMoneyMajor(locale, major, code, fractionDigits);
}

/**
 * Format a major-unit fiat amount with grouping and fixed decimals.
 * Example: 50000 → "$50,000.00" (USD) or "50,000.00" when currency omitted via style.
 */
export function formatMoneyMajor(
  locale: MoneyLocale,
  amount: string | number | null | undefined,
  currency = "USD",
  fractionDigits = 2,
): string {
  const value = toFiniteNumber(amount) ?? 0;
  const code = currency.toUpperCase();

  if (isCryptoCurrency(code)) {
    return formatCryptoAmount(value, code, cryptoFractionDigits(code));
  }

  try {
    return new Intl.NumberFormat(localeForIntl(locale), {
      style: "currency",
      currency: code,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(value);
  } catch {
    const grouped = new Intl.NumberFormat(localeForIntl(locale), {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(value);
    return `${code} ${grouped}`;
  }
}

/**
 * Crypto display: preserve asset precision and append ticker.
 * Examples: 0.52345678 BTC · 125.500000 USDT
 */
export function formatCryptoAmount(
  amount: string | number | null | undefined,
  currency: string,
  fractionDigits?: number,
): string {
  const code = currency.toUpperCase();
  const digits = fractionDigits ?? cryptoFractionDigits(code);
  const value = toFiniteNumber(amount) ?? 0;
  const grouped = new Intl.NumberFormat(DEFAULT_LOCALE, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    useGrouping: true,
  }).format(value);
  return `${grouped} ${code}`;
}

/** Alias used across UI for USD ledger minor amounts. */
export function formatUsdFromMinor(
  amountMinor: string | number | bigint | null | undefined,
  locale: MoneyLocale = "en",
): string {
  return formatMoneyMinorUnits(locale, amountMinor, "USD", 2);
}

/**
 * Format any presentation value that may be a minor-unit field.
 * Non-money values are returned as plain strings.
 */
export function formatMoneyFieldValue(
  key: string,
  value: unknown,
  currency = "USD",
  locale: MoneyLocale = "en",
): string {
  if (value == null) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (isMoneyMinorFieldKey(key)) {
    return formatMoneyMinorUnits(locale, value as string | number | bigint, currency, 2);
  }
  if (
    typeof value === "number" &&
    Number.isFinite(value) &&
    /amount|principal|balance|roi/i.test(key)
  ) {
    if (FIAT_CURRENCIES.has(currency.toUpperCase()) || currency.toUpperCase() === "USD") {
      return formatMoneyMajor(locale, value, currency, 2);
    }
  }
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/** Strip grouping characters and normalize a typed money string. */
export function sanitizeMoneyInput(raw: string): string {
  const cleaned = raw.replace(/[^\d.]/g, "");
  const firstDot = cleaned.indexOf(".");
  if (firstDot === -1) return cleaned.replace(/^0+(?=\d)/, "") || cleaned;
  const whole = cleaned.slice(0, firstDot).replace(/^0+(?=\d)/, "") || "0";
  const fraction = cleaned
    .slice(firstDot + 1)
    .replace(/\./g, "")
    .slice(0, 2);
  return `${whole}.${fraction}`;
}

/**
 * Display helper for amount inputs: inserts thousand separators while typing.
 * Example: "1000000" → "1,000,000" · "50000.75" → "50,000.75"
 */
export function formatMoneyInputDisplay(raw: string): string {
  const sanitized = sanitizeMoneyInput(raw);
  if (!sanitized) return "";
  const negative = raw.trim().startsWith("-");
  const [wholePart = "0", fractionPart] = sanitized.split(".");
  const wholeDigits = wholePart.replace(/\D/g, "") || "0";
  const grouped = wholeDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const hasDecimal = sanitized.includes(".");
  const body = hasDecimal ? `${grouped}.${fractionPart ?? ""}` : grouped;
  return negative ? `-${body}` : body;
}

/** Count digit characters before a caret index (ignores commas). */
export function countDigitsBefore(value: string, caret: number): number {
  let count = 0;
  const limit = Math.max(0, Math.min(caret, value.length));
  for (let i = 0; i < limit; i += 1) {
    if (/\d/.test(value[i] ?? "")) count += 1;
  }
  return count;
}

/** Place caret after N digits in a formatted money string. */
export function caretIndexAfterDigits(formatted: string, digitCount: number): number {
  if (digitCount <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < formatted.length; i += 1) {
    if (/\d/.test(formatted[i] ?? "")) {
      seen += 1;
      if (seen >= digitCount) return i + 1;
    }
  }
  return formatted.length;
}

/** Parse a typed/display amount into major units (dollars). */
export function parseMoneyInputToMajor(display: string): number | null {
  const sanitized = sanitizeMoneyInput(display);
  if (!sanitized || sanitized === ".") return null;
  const value = Number(sanitized);
  return Number.isFinite(value) ? value : null;
}

/**
 * Parse a typed USD amount into integer minor units (cents).
 * Accepts grouped input such as "1,000.50".
 */
export function parseMoneyInputToMinor(display: string): number | null {
  const sanitized = sanitizeMoneyInput(display);
  if (!sanitized || sanitized === ".") return null;
  if (!/^\d+(\.\d{0,2})?$/.test(sanitized)) return null;
  const [whole = "0", fraction = ""] = sanitized.split(".");
  const cents = `${whole}${fraction.padEnd(2, "0")}`.replace(/^0+(?=\d)/, "") || "0";
  const parsed = Number(cents);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

/** Positive minor units only (for deposits / withdrawals / investments). */
export function parsePositiveMoneyInputToMinor(display: string): number | null {
  const minor = parseMoneyInputToMinor(display);
  return minor != null && minor > 0 ? minor : null;
}

export function parsePositiveMoneyInputToMinorBigInt(display: string): bigint | null {
  const minor = parsePositiveMoneyInputToMinor(display);
  return minor == null ? null : BigInt(minor);
}
