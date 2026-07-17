"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";

import { Badge, Progress } from "@/components/ui";
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
  planName?: string;
  dailyRoiBps?: number;
  activatedAt?: string | null;
  dailyTargetMinor?: string;
  className?: string;
};

/** Live earnings hero when the customer has active investments. */
export function DashboardLiveEarnings({
  live,
  currency = "USD",
  portfolioValueMinor,
  timeRemainingLabel,
  planName,
  dailyRoiBps = 0,
  activatedAt,
  dailyTargetMinor = "0",
  className,
}: DashboardLiveEarningsProps) {
  const animatedTodayMinor = useAnimatedMinor(live.todayEarningsMinor);
  const todayLabel = formatMoneyMinorUnits("en", animatedTodayMinor, currency, 2);
  const signedToday = live.todayEarningsMinor.startsWith("-") ? todayLabel : `+${todayLabel}`;

  const targetMinor = BigInt(dailyTargetMinor || "0");
  const todayMinor = BigInt(live.todayEarningsMinor || "0");
  const accrualPercent =
    targetMinor > 0n ? Math.min(100, Number((todayMinor * 10_000n) / targetMinor) / 100) : 0;

  const todayFormatted = formatMoneyMinorUnits("en", live.todayEarningsMinor, currency, 2);
  const targetFormatted = formatMoneyMinorUnits("en", dailyTargetMinor, currency, 2);
  const countdown = formatCountdown(live.nextSettlementCountdownSeconds);
  const timeRemaining = formatTimeRemaining(timeRemainingLabel);

  return (
    <section
      aria-label="Live earnings"
      aria-live="polite"
      className={cn(
        "rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 via-card to-card p-5 shadow-[var(--elevation-2)] sm:p-6",
        className,
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border/60 pb-4">
        <div className="flex min-w-0 flex-1 flex-wrap items-start gap-3 sm:gap-4">
          <p className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            <LivePulse />
            <span>Investment Active</span>
          </p>

          <div className="min-w-0 space-y-0.5">
            {planName ? (
              <p className="truncate text-sm font-semibold text-foreground">{planName}</p>
            ) : null}
            {dailyRoiBps > 0 ? (
              <p className="text-xs text-muted-foreground">
                {formatDailyReturnLabel(dailyRoiBps)} Daily Return
              </p>
            ) : null}
            {activatedAt ? (
              <p className="text-xs text-muted-foreground">
                Active since {formatActiveSince(activatedAt)}
              </p>
            ) : null}
          </div>

          <Badge variant="success" className="shrink-0 uppercase tracking-wide">
            Active
          </Badge>
        </div>

        <Link
          href="/portfolio"
          className="shrink-0 text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          View Investments →
        </Link>
      </header>

      <div className="mt-5">
        <h2 className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
          <LivePulse className="h-1.5 w-1.5" />
          Live earnings
        </h2>
        <p
          className="mt-2 font-heading text-4xl font-semibold tracking-tight text-emerald-700 tabular-nums sm:text-5xl lg:text-6xl dark:text-emerald-400"
          aria-label={`Live earnings ${todayLabel}`}
        >
          {todayLabel}
        </p>
        <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <LivePulse className="h-1.5 w-1.5" />
          <span>Today&apos;s live earnings</span>
        </p>
        <p className="sr-only">
          Today&apos;s accrued earnings {signedToday}. Visual estimate only; credited amounts appear
          after settlement.
        </p>
      </div>

      <div className="mt-5 border-t border-border/60 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Today&apos;s Accrual Progress</p>
          <p className="tabular-nums">
            {todayFormatted} / {targetFormatted}{" "}
            <span className="text-muted-foreground">({accrualPercent.toFixed(2)}%)</span>
          </p>
        </div>
        <Progress
          value={accrualPercent}
          className="mt-2 h-1.5 [&_[data-slot=progress-indicator]]:bg-emerald-500 [&_[data-slot=progress-indicator]]:transition-transform [&_[data-slot=progress-indicator]]:duration-500 [&_[data-slot=progress-indicator]]:ease-out"
          aria-label={`Today's accrual progress ${accrualPercent.toFixed(2)} percent`}
        />
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-border/60 pt-4 sm:grid-cols-3 lg:grid-cols-6 lg:gap-4">
        <MetricCell label="Today's Earnings">
          <span className="text-emerald-700 tabular-nums dark:text-emerald-400">{signedToday}</span>
        </MetricCell>
        <MetricCell label="Total ROI Earned">
          <CurrencyDisplay
            amountMinor={Number(live.totalLiveEarningsMinor)}
            currency={currency}
            className="text-sm font-semibold text-foreground"
          />
        </MetricCell>
        <MetricCell label="Current Investment Value">
          <CurrencyDisplay
            amountMinor={Number(live.currentValueMinor)}
            currency={currency}
            className="text-sm font-semibold text-foreground"
          />
        </MetricCell>
        <MetricCell label="Portfolio Value">
          <CurrencyDisplay
            amountMinor={Number(portfolioValueMinor ?? live.currentValueMinor)}
            currency={currency}
            className="text-sm font-semibold text-foreground"
          />
        </MetricCell>
        <MetricCell label="Next Credit">
          <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
            {countdown}
          </span>
          <span className="sr-only">Next credit in {countdown}</span>
        </MetricCell>
        <MetricCell label="Time Remaining">
          <span className="text-sm font-semibold tabular-nums text-foreground">
            {timeRemaining}
          </span>
        </MetricCell>
      </dl>
    </section>
  );
}

function MetricCell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 border-border/60 sm:border-r sm:pr-3 last:sm:border-r-0 lg:pr-4">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-semibold">{children}</dd>
    </div>
  );
}

function LivePulse({ className }: { className?: string }) {
  return (
    <span className={cn("relative flex h-2 w-2 shrink-0", className)} aria-hidden>
      <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 motion-safe:animate-ping motion-reduce:animate-none" />
      <span className="relative inline-flex h-full w-full rounded-full bg-emerald-500" />
    </span>
  );
}

function useAnimatedMinor(valueMinor: string): string {
  const target = useMemo(() => parseMinorBigInt(valueMinor), [valueMinor]);
  const [displayMinor, setDisplayMinor] = useState(target);
  const fromRef = useRef(target);
  const frameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const from = fromRef.current;
    const to = target;
    if (from === to) {
      setDisplayMinor(to);
      return;
    }

    const fromNum = Number(from);
    const toNum = Number(to);
    const start = performance.now();
    const duration = 350;

    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const current = Math.round(fromNum + (toNum - fromNum) * progress);
      setDisplayMinor(BigInt(current));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step);
      } else {
        fromRef.current = to;
        setDisplayMinor(to);
      }
    };

    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [target]);

  return displayMinor.toString();
}

function parseMinorBigInt(value: string): bigint {
  try {
    return BigInt(value || "0");
  } catch {
    return 0n;
  }
}

function formatDailyReturnLabel(bps: number): string {
  return `${(bps / 100).toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  })}%`;
}

function formatActiveSince(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

function formatTimeRemaining(label?: string): string {
  if (!label || label === "—") return "—";
  return label.replace(/\b(\d+)\s+day\b/i, "$1 Day").replace(/\b(\d+)\s+days\b/i, "$1 Days");
}
