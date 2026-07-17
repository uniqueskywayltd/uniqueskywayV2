"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, PieChart } from "lucide-react";

import { Button, Skeleton, StatusChip } from "@/components/ui";
import { buttonVariants } from "@/components/ui/button";
import { CurrencyDisplay, DateDisplay } from "@/components/ui/display";
import { Progress } from "@/components/ui/progress";
import { getCustomerJson } from "@/features/customer/api-client";
import { PortfolioReveal } from "@/features/customer/portfolio/portfolio-motion";
import {
  presentInvestmentStatus,
  presentScheduleStatus,
} from "@/features/customer/portfolio/status-presentation";
import type { PortfolioDetailResponse } from "@/features/customer/portfolio/types";
import {
  formatCountdown,
  remainingDaysLabel,
  useLiveAccrual,
} from "@/features/customer/portfolio/use-live-accrual";
import { cn } from "@/lib/utils";

/** PF3–PF5 — investment passport over certified detail read models only. */
export function InvestmentDetailView({ investmentId }: { investmentId: string }) {
  const [data, setData] = useState<PortfolioDetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    void getCustomerJson<PortfolioDetailResponse>(`/api/customer/investments/${investmentId}`).then(
      (result) => {
        if (!active) return;
        if (result.error) {
          setError(result.error);
          setData(null);
          setLoading(false);
          return;
        }
        setError(null);
        setData(result.data ?? null);
        setLoading(false);
      },
    );

    return () => {
      active = false;
    };
  }, [investmentId]);

  const investment = data?.investment;
  const live = useLiveAccrual(
    investment && (investment.status === "active" || investment.status === "maturing")
      ? {
          principalMinor: investment.principalMinor,
          dailyRoiBps: investment.dailyRoiBps ?? 0,
          activatedAt: investment.activatedAt,
          termDays: investment.termDays,
          postedRoiMinor: investment.postedRoiMinor,
          promisedRoiMinor: investment.promisedRoiMinor ?? null,
          status: investment.status,
        }
      : null,
  );

  if (loading) {
    return (
      <div className="space-y-6 sm:space-y-8" aria-busy="true" aria-label="Loading investment">
        <Skeleton className="h-36 w-full rounded-2xl sm:h-40" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-56 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !data || !investment) {
    return (
      <section
        className="rounded-xl border border-destructive/30 bg-destructive/5 p-6"
        role="alert"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <PieChart className="h-5 w-5" aria-hidden />
        </div>
        <h1 className="mt-4 text-lg font-semibold text-foreground">Investment unavailable</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error ?? "We could not find that investment."}
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/portfolio">Back to investments</Link>
        </Button>
      </section>
    );
  }

  const { schedule, lifecycle } = data;
  const status = presentInvestmentStatus(investment.status);
  const progress = investment.progressPercent;
  const isActiveLike = investment.status === "active" || investment.status === "maturing";
  const activationDate = investment.activatedAt ?? investment.startAt;
  const totalEarningsMinor = live?.totalLiveEarningsMinor ?? investment.postedRoiMinor;
  const currentValueMinor =
    live?.currentValueMinor ??
    String(BigInt(investment.principalMinor) + BigInt(investment.postedRoiMinor));
  const todayEarningsMinor = live?.todayEarningsMinor ?? "0";
  const dailyPct = ((investment.dailyRoiBps ?? 0) / 100).toFixed(2);
  const daysRemaining = remainingDaysLabel(investment.maturityDate);

  return (
    <div className="space-y-6 sm:space-y-8">
      <p className="sr-only">Primary question: Tell me everything about this investment.</p>

      <PortfolioReveal>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/portfolio"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            All investments
          </Link>
          <Link
            href="/ledger"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-2")}
          >
            Open ledger
          </Link>
        </div>
      </PortfolioReveal>

      <PortfolioReveal delayMs={40}>
        <section
          className="relative overflow-hidden rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-7 md:p-8"
          aria-label="Investment header"
        >
          <div
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,var(--primary)_0%,transparent_45%),linear-gradient(225deg,rgba(139,92,246,0.14)_0%,transparent_55%)] opacity-[0.18] dark:opacity-[0.28]"
            aria-hidden
          />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-medium tracking-wide text-primary/80">Current plan</p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {investment.planName}
              </h1>
              {isActiveLike ? (
                <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-muted-foreground">Days remaining</dt>
                    <dd className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">
                      {daysRemaining}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Maturity date</dt>
                    <dd className="mt-0.5 text-lg font-semibold text-foreground">
                      {investment.maturityDate ? (
                        <DateDisplay value={investment.maturityDate} />
                      ) : (
                        "—"
                      )}
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  Wallet credits post at New York settlement or maturity — the ledger remains the
                  source of truth.
                </p>
              )}
            </div>
            <StatusChip tone={status.tone}>{status.label}</StatusChip>
          </div>
          <div
            className={cn(
              "absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r",
              isActiveLike
                ? "from-transparent via-emerald-500/70 to-transparent"
                : investment.status === "pending"
                  ? "from-transparent via-amber-500/70 to-transparent"
                  : "from-transparent via-violet-500/70 to-transparent",
            )}
            aria-hidden
          />
        </section>
      </PortfolioReveal>

      {isActiveLike ? (
        <section
          className="rounded-xl border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground"
          role="note"
        >
          Your investment is committed for the full investment period in accordance with the{" "}
          <Link
            href="/legal/terms"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Terms of Service
          </Link>{" "}
          accepted during registration.
        </section>
      ) : null}

      {investment.status === "pending" ? (
        <section
          className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5"
          role="status"
          aria-label="Activation notice"
        >
          <h2 className="text-sm font-semibold text-foreground">Activation in progress</h2>
          <p className="mt-1 text-sm text-muted-foreground">{status.explanation}</p>
        </section>
      ) : null}

      {isActiveLike ? (
        <section aria-label="Live performance">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Live performance
          </h2>
          <dl className="grid gap-4 rounded-xl border border-border/70 bg-card/90 p-5 text-sm shadow-sm sm:grid-cols-2 lg:grid-cols-3">
            <DetailField label="Principal">
              <CurrencyDisplay
                amountMinor={Number(investment.principalMinor)}
                currency={investment.currency}
              />
            </DetailField>
            <DetailField label="Current investment value">
              <CurrencyDisplay
                amountMinor={Number(currentValueMinor)}
                currency={investment.currency}
              />
            </DetailField>
            <DetailField label="Live earnings">
              <CurrencyDisplay
                amountMinor={Number(totalEarningsMinor)}
                currency={investment.currency}
              />
            </DetailField>
            <DetailField label="Today's live earnings">
              <CurrencyDisplay
                amountMinor={Number(todayEarningsMinor)}
                currency={investment.currency}
              />
            </DetailField>
            <DetailField label="ROI credited (ledger)">
              <CurrencyDisplay
                amountMinor={Number(investment.postedRoiMinor)}
                currency={investment.currency}
              />
            </DetailField>
            <DetailField label="Daily ROI">
              <span className="tabular-nums">{dailyPct}%</span>
            </DetailField>
            <DetailField label="Days remaining">
              <span className="font-semibold tabular-nums">{daysRemaining}</span>
            </DetailField>
            <DetailField label="Next settlement">
              <span className="font-mono tabular-nums">
                {live ? formatCountdown(live.nextSettlementCountdownSeconds) : "—"}
              </span>
            </DetailField>
            <DetailField label="Maturity date">
              {investment.maturityDate ? <DateDisplay value={investment.maturityDate} /> : "—"}
            </DetailField>
            <DetailField label="Expected total return">
              {investment.expectedTotalReturnMinor ? (
                <CurrencyDisplay
                  amountMinor={Number(investment.expectedTotalReturnMinor)}
                  currency={investment.currency}
                />
              ) : (
                "—"
              )}
            </DetailField>
          </dl>
        </section>
      ) : null}

      <section aria-label="Investment details">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Investment details
        </h2>
        <dl className="grid gap-4 rounded-xl border border-border/70 bg-card/90 p-5 text-sm shadow-sm sm:grid-cols-2 lg:grid-cols-3">
          <DetailField label="Principal">
            <CurrencyDisplay
              amountMinor={Number(investment.principalMinor)}
              currency={investment.currency}
            />
          </DetailField>
          <DetailField label="ROI credited">
            <CurrencyDisplay
              amountMinor={Number(investment.postedRoiMinor)}
              currency={investment.currency}
            />
          </DetailField>
          <DetailField label="Term">
            <span className="tabular-nums">{investment.termDays} days</span>
          </DetailField>
          <DetailField label="Status">
            <span>{status.label}</span>
          </DetailField>
          <DetailField label="Start date">
            {activationDate ? <DateDisplay value={activationDate} /> : "—"}
          </DetailField>
          <DetailField label="Maturity date">
            {investment.maturityDate ? <DateDisplay value={investment.maturityDate} /> : "—"}
          </DetailField>
          <DetailField label="First settlement">
            {investment.firstSettlementDate ? (
              <DateDisplay value={investment.firstSettlementDate} />
            ) : (
              "—"
            )}
          </DetailField>
          <DetailField label="Progress">
            <span className="tabular-nums">{progress === null ? "—" : `${progress}%`}</span>
          </DetailField>
          <DetailField label="What happens next?" className="sm:col-span-2 lg:col-span-1">
            <span>
              {investment.nextMilestone.label}
              {investment.nextMilestone.date ? (
                <>
                  {" · "}
                  <DateDisplay value={investment.nextMilestone.date} />
                </>
              ) : null}
            </span>
          </DetailField>
        </dl>
      </section>

      {progress !== null ? (
        <section aria-label="Progress">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Progress
          </h2>
          <div className="rounded-xl border border-border/70 bg-card/90 p-5 shadow-sm">
            <div className="mb-2 flex justify-between text-xs text-muted-foreground">
              <span>Toward maturity</span>
              <span className="tabular-nums">{progress}%</span>
            </div>
            <Progress
              value={progress}
              className={cn(
                isActiveLike && "[&_[data-slot=progress-indicator]]:bg-emerald-500",
                investment.status === "matured" && "[&_[data-slot=progress-indicator]]:bg-sky-500",
              )}
              aria-label={`Progress ${progress}%`}
            />
          </div>
        </section>
      ) : null}

      <section aria-label="Lifecycle">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Lifecycle
        </h2>
        <ol className="space-y-0 rounded-xl border border-border/70 bg-card/90 p-5 shadow-sm">
          {lifecycle.map((step, index) => {
            const isLast = index === lifecycle.length - 1;
            return (
              <li key={step.key} className="relative flex gap-4 pb-5 last:pb-0">
                {!isLast ? (
                  <span
                    className="absolute top-3 left-[0.6875rem] h-[calc(100%-0.5rem)] w-px bg-border"
                    aria-hidden
                  />
                ) : null}
                <span
                  className={cn(
                    "relative z-[1] mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[0.65rem] font-semibold",
                    step.complete
                      ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                      : "border-border bg-muted text-muted-foreground",
                  )}
                  aria-hidden
                >
                  {step.complete ? "✓" : index + 1}
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className="text-sm font-medium text-foreground">
                    {step.label}
                    {!step.complete ? (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        upcoming
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {step.at ? <DateDisplay value={step.at} /> : "Not yet"}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <section aria-label="Settlement schedule">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Settlement schedule
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Certified New York settlement days. Credited means posted — not a promise of future
              amounts.
            </p>
          </div>
          <Link
            href="/ledger"
            className="text-xs font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            View ledger
          </Link>
        </div>
        {schedule.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border/80 p-5 text-sm text-muted-foreground">
            No schedule items yet.
          </p>
        ) : (
          <ul className="divide-y divide-border/70 overflow-hidden rounded-xl border border-border/70 bg-card/90 shadow-sm">
            {schedule.map((item) => {
              const scheduleStatus = presentScheduleStatus(item.status);
              return (
                <li
                  key={item.id}
                  className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      #{item.sequenceNumber}
                      <span className="font-normal text-muted-foreground">
                        {" · Earn "}
                        <DateDisplay value={item.earningDate} />
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Settle <DateDisplay value={item.settlementDate} />
                      {item.postedAt ? (
                        <>
                          {" · Posted "}
                          <DateDisplay value={item.postedAt} />
                        </>
                      ) : null}
                    </p>
                  </div>
                  <StatusChip tone={scheduleStatus.tone}>{scheduleStatus.label}</StatusChip>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section
        aria-label="Important notices"
        className="rounded-xl border border-border/70 bg-muted/20 p-5 sm:p-6"
      >
        <h2 className="text-sm font-semibold text-foreground">Important notices</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          <li>{status.explanation}</li>
          <li>
            Live counters are visual only. Ledger postings happen on daily New York settlement or at
            maturity.
          </li>
          <li>
            Investments run for the full plan term. Principal and eligible earnings release
            according to platform rules when the investment matures.
          </li>
          <li>
            Returns are not guaranteed. Schedule rows are not withdrawable until credited to your
            wallet.
          </li>
        </ul>
      </section>
    </div>
  );
}

function DetailField({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-semibold text-foreground">{children}</dd>
    </div>
  );
}
