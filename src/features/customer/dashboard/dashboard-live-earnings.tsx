"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { TrendingUp } from "lucide-react";

import { Button } from "@/components/ui";
import { CurrencyDisplay } from "@/components/ui/display";
import {
  formatCountdown,
  type AggregatedLiveAccrualView,
} from "@/features/customer/portfolio/use-live-accrual";
import { formatMoneyMinorUnits } from "@/lib/money-format";
import { cn } from "@/lib/utils";

type DashboardLiveEarningsProps = {
  live: AggregatedLiveAccrualView;
  currency?: string;
  portfolioValueMinor?: string;
  timeRemainingLabel?: string;
  className?: string;
};

/** Live earnings hero when the customer has active investments. */
export function DashboardLiveEarnings({
  live,
  currency = "USD",
  portfolioValueMinor,
  timeRemainingLabel,
  className,
}: DashboardLiveEarningsProps) {
  const todayLabel = formatMoneyMinorUnits("en", live.todayEarningsMinor, currency, 2);
  const signedToday = live.todayEarningsMinor.startsWith("-") ? todayLabel : `+${todayLabel}`;

  return (
    <section
      aria-label="Live earnings"
      aria-live="polite"
      className={cn(
        "relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/12 via-card to-card p-6 shadow-[var(--elevation-2)] sm:p-8",
        "motion-safe:transition-[box-shadow,border-color] motion-safe:duration-300 motion-reduce:transition-none",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute -top-12 right-0 h-40 w-40 rounded-full bg-emerald-400/20 blur-3xl motion-safe:animate-pulse motion-reduce:animate-none"
        aria-hidden
      />

      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
          <span className="relative flex h-2.5 w-2.5" aria-hidden>
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 motion-safe:animate-ping motion-reduce:animate-none" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          🟢 Investment Active
        </p>
        <Button asChild variant="outline" size="sm" className="gap-1.5">
          <Link href="/portfolio">
            <TrendingUp className="h-3.5 w-3.5" aria-hidden />
            View portfolio
          </Link>
        </Button>
      </div>

      <div className="relative mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-end">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Today&apos;s Earnings
          </p>
          <p
            key={live.todayEarningsMinor}
            className={cn(
              "mt-2 font-heading text-4xl font-semibold tracking-tight text-emerald-700 tabular-nums sm:text-5xl dark:text-emerald-400",
              "motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300 motion-reduce:animate-none",
            )}
          >
            <span aria-hidden>🟢 </span>
            {signedToday}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">Accrued Today</p>
          <p className="sr-only">
            Today&apos;s accrued earnings {signedToday}. Visual estimate only; credited amounts
            appear after settlement.
          </p>
        </div>

        <dl className="grid gap-3 sm:grid-cols-2">
          <Metric
            label="Current Investment Value"
            value={
              <CurrencyDisplay amountMinor={Number(live.currentValueMinor)} currency={currency} />
            }
          />
          <Metric
            label="Portfolio Value"
            value={
              <CurrencyDisplay
                amountMinor={Number(portfolioValueMinor ?? live.currentValueMinor)}
                currency={currency}
              />
            }
          />
          <Metric
            label="Total ROI Earned"
            value={
              <CurrencyDisplay
                amountMinor={Number(live.totalLiveEarningsMinor)}
                currency={currency}
              />
            }
            emphasize
          />
          <Metric
            label="Next Daily Credit"
            value={
              <span className="font-mono text-base tabular-nums">
                {formatCountdown(live.nextSettlementCountdownSeconds)}
              </span>
            }
          />
          <Metric
            label="Time Remaining"
            value={
              <span className="tabular-nums">
                {timeRemainingLabel ?? formatCountdown(live.nextSettlementCountdownSeconds)}
              </span>
            }
          />
          <Metric
            label="Active Investments"
            value={<span className="tabular-nums">{live.activeCount}</span>}
          />
        </dl>
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: ReactNode;
  emphasize?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/60 px-3.5 py-3 backdrop-blur-sm dark:bg-background/40">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "mt-1 text-sm font-semibold text-foreground",
          emphasize && "text-emerald-700 dark:text-emerald-400",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
