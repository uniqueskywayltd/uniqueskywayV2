import { FINANCIAL_TIME_ZONE } from "@/config/constants";
import { cn } from "@/lib/utils";

export interface CurrencyDisplayProps {
  amountMinor: number;
  currency?: string;
  locale?: string;
  className?: string;
}

export function CurrencyDisplay({
  amountMinor,
  currency = "USD",
  locale = "en-US",
  className,
}: CurrencyDisplayProps) {
  const value = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amountMinor / 100);

  return <span className={cn("font-mono tabular-nums", className)}>{value}</span>;
}

export interface PercentageDisplayProps {
  value: number;
  locale?: string;
  className?: string;
}

export function PercentageDisplay({ value, locale = "en-US", className }: PercentageDisplayProps) {
  const formatted = new Intl.NumberFormat(locale, {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

  return <span className={cn("font-mono tabular-nums", className)}>{formatted}</span>;
}

export interface DateDisplayProps {
  value: Date | string | number;
  locale?: string;
  timeZone?: string;
  className?: string;
}

export function DateDisplay({
  value,
  locale = "en-US",
  timeZone = FINANCIAL_TIME_ZONE,
  className,
}: DateDisplayProps) {
  const formatted = new Intl.DateTimeFormat(locale, {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    timeZone,
  }).format(new Date(value));

  return <time className={cn("font-mono tabular-nums", className)}>{formatted}</time>;
}

export interface RoiDisplayProps {
  value: number;
  className?: string;
}

export function RoiDisplay({ value, className }: RoiDisplayProps) {
  const tone = value >= 0 ? "text-roi-positive" : "text-financial-negative";

  return <PercentageDisplay value={value} className={cn("font-semibold", tone, className)} />;
}
