"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";

import { Badge, Progress } from "@/components/ui";
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

  const totalRoiLabel = formatMoneyMinorUnits("en", live.totalLiveEarningsMinor, currency, 2);
  const currentValueLabel = formatMoneyMinorUnits("en", live.currentValueMinor, currency, 2);
  const portfolioValueLabel = formatMoneyMinorUnits(
    "en",
    portfolioValueMinor ?? live.currentValueMinor,
    currency,
    2,
  );

  return (
    <section
      aria-label="Live earnings"
      aria-live="polite"
      className={cn(
        "rounded-xl border border-border/60 bg-card p-4 shadow-[var(--elevation-2)] sm:p-5",
        className,
      )}
    >
      <header className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <span className="inline-flex shrink-0 items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-400">
            <LivePulse className="h-1.5 w-1.5" />
            Investment Active
          </span>
          {planName ? (
            <>
              <span className="text-muted-foreground/70" aria-hidden>
                ·
              </span>
              <span className="truncate font-medium text-foreground">{planName}</span>
            </>
          ) : null}
          <Badge variant="success" className="h-5 shrink-0 px-1.5 text-[10px] uppercase">
            Active
          </Badge>
          {dailyRoiBps > 0 || activatedAt ? (
            <span className="hidden text-muted-foreground lg:inline">
              {dailyRoiBps > 0 ? (
                <>
                  <span className="mx-1 text-muted-foreground/70" aria-hidden>
                    ·
                  </span>
                  {formatDailyReturnLabel(dailyRoiBps)} daily
                </>
              ) : null}
              {activatedAt ? (
                <>
                  <span className="mx-1 text-muted-foreground/70" aria-hidden>
                    ·
                  </span>
                  Since {formatActiveSince(activatedAt)}
                </>
              ) : null}
            </span>
          ) : null}
        </div>

        <Link
          href="/portfolio"
          className="shrink-0 text-sm font-medium text-primary transition-colors hover:text-primary/80"
        >
          Manage investment
        </Link>
      </header>

      <div className="mt-3">
        <h2 className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
          Today&apos;s live earnings
        </h2>
        <p
          className="mt-0.5 font-heading text-4xl font-extrabold leading-none text-emerald-600 tabular-nums sm:text-[2.75rem] dark:text-emerald-400"
          aria-label={`Live earnings ${todayLabel}`}
        >
          {todayLabel}
        </p>
        <p className="sr-only">
          Today&apos;s accrued earnings {signedToday}. Visual estimate only; credited amounts appear
          after settlement.
        </p>
      </div>

      <div className="my-3 border-t border-border/50" aria-hidden />

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-6">
        <MetricCell label="Today's Live Earnings">
          <span className="font-bold text-emerald-600 tabular-nums dark:text-emerald-400">
            {signedToday}
          </span>
        </MetricCell>
        <MetricCell label="Total Earnings">
          <span className="font-bold text-foreground tabular-nums">{totalRoiLabel}</span>
        </MetricCell>
        <MetricCell label="Current Investment Value">
          <span className="font-bold text-foreground tabular-nums">{currentValueLabel}</span>
        </MetricCell>
        <MetricCell label="Current Investment">
          <span className="font-bold text-foreground tabular-nums">{portfolioValueLabel}</span>
        </MetricCell>
        <MetricCell label="Next Settlement">
          <span className="font-mono text-sm font-bold tabular-nums text-foreground">
            {countdown}
          </span>
          <span className="sr-only">Next settlement in {countdown}</span>
        </MetricCell>
        <MetricCell label="Days Remaining">
          <span className="font-bold text-foreground tabular-nums">{timeRemaining}</span>
        </MetricCell>
      </dl>

      <div className="mt-3 border-t border-border/50 pt-3">
        <div className="mb-1.5 flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>Today&apos;s accrual progress</span>
          <span className="shrink-0 tabular-nums text-foreground">
            {todayFormatted} / {targetFormatted}{" "}
            <span className="text-muted-foreground">({formatAccrualPercent(accrualPercent)})</span>
          </span>
        </div>
        <Progress
          value={accrualPercent}
          className="h-1 rounded-full bg-muted [&_[data-slot=progress-indicator]]:rounded-full [&_[data-slot=progress-indicator]]:bg-emerald-500 [&_[data-slot=progress-indicator]]:transition-transform [&_[data-slot=progress-indicator]]:duration-500 [&_[data-slot=progress-indicator]]:ease-out"
          aria-label={`Today's accrual progress ${formatAccrualPercent(accrualPercent)}`}
        />
      </div>
    </section>
  );
}

function MetricCell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm">{children}</dd>
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

function formatAccrualPercent(value: number): string {
  if (value >= 10) return `${value.toFixed(1)}%`;
  if (value >= 1) return `${value.toFixed(1)}%`;
  return `${value.toFixed(2)}%`;
}
