"use client";

import { useEffect, useState } from "react";

import {
  formatTickerChange,
  formatTickerRate,
  type MarketTickerQuote,
} from "@/lib/market/daily-exchange-rates";
import { cn } from "@/lib/utils";

type TickerResponse = {
  enabled?: boolean;
  quotes?: MarketTickerQuote[];
  lastUpdated?: string;
};

/**
 * Market overview strip — daily FX rates (ECB) + crypto (24h).
 */
export function CurrencyTicker({ className }: { className?: string }) {
  const [quotes, setQuotes] = useState<MarketTickerQuote[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch("/api/market-ticker");
        if (!res.ok) return;
        const data = (await res.json()) as TickerResponse;
        if (!active) return;
        if (data.enabled === false || !data.quotes?.length) return;
        setQuotes(data.quotes);
        setLastUpdated(data.lastUpdated ?? null);
      } catch {
        /* keep prior quotes on soft failure */
      }
    }

    void load();
    const interval = window.setInterval(load, 15 * 60 * 1000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  if (quotes.length === 0) return null;

  const loop = [...quotes, ...quotes];

  return (
    <div
      className={cn(
        "overflow-hidden border-b border-border/50 bg-muted/40 text-foreground",
        className,
      )}
      aria-label="Market overview"
      role="region"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="relative flex h-10 items-center overflow-hidden">
        <div
          className={cn(
            "legacy-ticker-track flex w-max gap-0 pr-4",
            !reduceMotion && !paused && "animate-[legacyTicker_40s_linear_infinite]",
          )}
        >
          {loop.map((row, index) => {
            const positive = row.changePercent >= 0;
            return (
              <span
                key={`${row.pair}-${index}`}
                className="inline-flex shrink-0 items-center gap-3 border-r border-border/40 px-4 py-2.5"
              >
                <span className="text-[11px] font-semibold tracking-wider uppercase text-foreground/80">
                  {row.pair}
                </span>
                <span className="text-sm font-medium tabular-nums text-foreground">
                  {formatTickerRate(row.pair, row.rate)}
                </span>
                <span
                  className={cn(
                    "text-xs font-medium tabular-nums",
                    positive ? "text-emerald-600" : "text-red-600",
                  )}
                >
                  {positive ? "▲" : "▼"} {formatTickerChange(row.changePercent)}
                </span>
              </span>
            );
          })}
        </div>
      </div>
      {lastUpdated ? (
        <p className="sr-only">
          Market data last updated {new Date(lastUpdated).toLocaleString()}
        </p>
      ) : null}
    </div>
  );
}
