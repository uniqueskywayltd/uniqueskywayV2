"use client";

import { LEGACY_CURRENCY_TICKER_ROWS } from "@/features/public/legacy/nav";
import { cn } from "@/lib/utils";

/**
 * Market illustration strip — platform placement (below sticky header).
 * Rates remain illustrative only (never live market data).
 */
export function CurrencyTicker({ className }: { className?: string }) {
  const loop = [...LEGACY_CURRENCY_TICKER_ROWS, ...LEGACY_CURRENCY_TICKER_ROWS];

  return (
    <div
      className={cn(
        "overflow-hidden border-b border-border/50 bg-muted/40 text-foreground",
        className,
      )}
      aria-label="Illustrative exchange rates — not live"
      role="region"
    >
      <div className="relative flex h-10 items-center">
        <p className="shrink-0 border-r border-border/60 px-4 text-[11px] font-semibold tracking-wider whitespace-nowrap uppercase text-muted-foreground">
          Illustrative — not live
        </p>
        <div className="legacy-ticker-track flex w-max animate-[legacyTicker_40s_linear_infinite] gap-0 pr-4">
          {loop.map((row, index) => {
            const positive = !row.change.startsWith("-");
            return (
              <span
                key={`${row.pair}-${index}`}
                className="inline-flex shrink-0 items-center gap-3 border-r border-border/40 px-4 py-2.5"
              >
                <span className="text-[11px] font-semibold tracking-wider uppercase text-foreground/80">
                  {row.pair}
                </span>
                <span className="text-sm font-medium tabular-nums text-foreground">{row.rate}</span>
                <span
                  className={cn(
                    "text-xs font-medium tabular-nums",
                    positive ? "text-emerald-600" : "text-red-600",
                  )}
                >
                  {positive ? "▲" : "▼"} {row.change}
                </span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
