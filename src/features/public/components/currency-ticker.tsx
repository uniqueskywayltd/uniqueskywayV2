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

function QuoteItems({ quotes, keyPrefix }: { quotes: MarketTickerQuote[]; keyPrefix: string }) {
  return quotes.map((row) => {
    const positive = row.changePercent >= 0;
    return (
      <span
        key={`${keyPrefix}-${row.pair}`}
        className="inline-flex shrink-0 items-center gap-3 border-r border-border/40 px-4 py-2.5 last:border-r-0"
      >
        <span className="text-[11px] font-semibold tracking-wider text-foreground/80 uppercase">
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
  });
}

/**
 * Market overview strip — continuous horizontal slide (marquee).
 * Homepage only via PublicShell `showMarketTicker`.
 */
export function CurrencyTicker({ className }: { className?: string }) {
  const [quotes, setQuotes] = useState<MarketTickerQuote[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch("/api/market-ticker");
        if (!res.ok) return;
        const data = (await res.json()) as TickerResponse;
        if (!active) return;
        if (data.enabled === false || !data.quotes?.length) {
          setQuotes([]);
          return;
        }
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

  return (
    <div
      className={cn(
        "relative z-30 overflow-hidden border-b border-border/50 bg-muted/40 text-foreground",
        className,
      )}
      aria-label="Market overview"
      role="region"
    >
      <div className="mx-auto flex h-11 w-full items-center overflow-hidden sm:h-12">
        <div className="animate-market-ticker flex w-max items-center">
          <div className="flex items-center" aria-hidden={false}>
            <QuoteItems quotes={quotes} keyPrefix="a" />
          </div>
          <div className="flex items-center" aria-hidden="true">
            <QuoteItems quotes={quotes} keyPrefix="b" />
          </div>
        </div>
      </div>
      {lastUpdated ? (
        <p className="sr-only">Market data last updated {new Date(lastUpdated).toLocaleString()}</p>
      ) : null}
    </div>
  );
}
