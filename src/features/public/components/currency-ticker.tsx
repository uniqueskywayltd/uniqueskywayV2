"use client";

import { LEGACY_CURRENCY_TICKER_ROWS } from "@/features/public/legacy/nav";

/**
 * Native currency ticker — visual parity with legacy exchangerates iframe.
 * No third-party script or iframe (HP1 / DEC third-party policy).
 * LP1 — rates are illustrative only, never presented as live data.
 */
export function CurrencyTicker() {
  const loop = [...LEGACY_CURRENCY_TICKER_ROWS, ...LEGACY_CURRENCY_TICKER_ROWS];

  return (
    <div
      className="overflow-hidden border-b border-[#000044]/30 bg-[#f0f0f0] font-[family-name:var(--font-legacy-arimo),Arimo,sans-serif] text-[10px] leading-[30px] text-[#000044]"
      aria-label="Illustrative exchange rates — not live"
      role="region"
    >
      <div className="relative flex h-[30px] items-center gap-4">
        <p className="shrink-0 border-r border-[#000044]/20 px-3 font-bold tracking-wide whitespace-nowrap">
          Illustrative exchange rates — not live
        </p>
        <div className="legacy-ticker-track flex w-max animate-[legacyTicker_40s_linear_infinite] gap-8 pr-4">
          {loop.map((row, index) => (
            <span
              key={`${row.pair}-${index}`}
              className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap"
            >
              <span className="font-bold">{row.pair}</span>
              <span>{row.rate}</span>
              <span
                className={row.change.startsWith("-") ? "text-[#FF0000]" : "text-[#008000]"}
              >
                {row.change}
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
