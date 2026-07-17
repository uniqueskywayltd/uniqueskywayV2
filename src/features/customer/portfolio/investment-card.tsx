"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { StatusChip } from "@/components/ui";
import { CurrencyDisplay, DateDisplay } from "@/components/ui/display";
import { Progress } from "@/components/ui/progress";
import { presentInvestmentStatus } from "@/features/customer/portfolio/status-presentation";
import type { PortfolioInvestmentCard } from "@/features/customer/portfolio/types";
import {
  formatCountdown,
  remainingDaysLabel,
  useLiveAccrual,
} from "@/features/customer/portfolio/use-live-accrual";
import { useI18n } from "@/features/i18n/i18n-provider";
import { cn } from "@/lib/utils";

/** PF2 — platform-aligned card bound only to certified investment read fields. */
export function InvestmentCard({ investment }: { investment: PortfolioInvestmentCard }) {
  const { t } = useI18n();
  const status = presentInvestmentStatus(investment.status, t);
  const progress = investment.progressPercent;
  const isActiveLike = investment.status === "active" || investment.status === "maturing";
  const live = useLiveAccrual(
    isActiveLike && investment.dailyRoiBps !== undefined
      ? {
          principalMinor: investment.principalMinor,
          dailyRoiBps: investment.dailyRoiBps,
          activatedAt: investment.activatedAt,
          termDays: investment.termDays,
          postedRoiMinor: investment.postedRoiMinor,
          promisedRoiMinor: investment.promisedRoiMinor ?? null,
          status: investment.status,
        }
      : null,
  );

  const totalEarningsMinor = live?.totalLiveEarningsMinor ?? investment.postedRoiMinor;
  const currentValueMinor =
    live?.currentValueMinor ??
    String(BigInt(investment.principalMinor) + BigInt(investment.postedRoiMinor));
  const todayEarningsMinor = live?.todayEarningsMinor ?? "0";

  return (
    <Link
      href={`/portfolio/${investment.id}`}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-xl border border-border/70 bg-card/90 p-4 shadow-sm",
        "motion-safe:transition-[border-color,background-color,box-shadow,transform] motion-safe:duration-200 motion-reduce:transition-none",
        "hover:border-primary/30 hover:bg-muted/20 motion-safe:hover:-translate-y-0.5 hover:shadow-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "sm:p-5",
      )}
    >
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-1 bg-gradient-to-r",
          isActiveLike
            ? "from-emerald-500/70 via-emerald-400/35 to-transparent"
            : investment.status === "pending"
              ? "from-amber-500/70 via-amber-400/35 to-transparent"
              : investment.status === "matured"
                ? "from-sky-500/70 via-sky-400/35 to-transparent"
                : "from-muted-foreground/30 via-muted-foreground/15 to-transparent",
        )}
        aria-hidden
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {t("portfolio.card.assigned_plan")}
          </p>
          <h2 className="mt-1 truncate text-base font-semibold text-foreground">
            {investment.planName}
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <StatusChip tone={status.tone}>{status.label}</StatusChip>
          <ChevronRight
            className="h-4 w-4 text-muted-foreground motion-safe:transition-transform motion-safe:duration-200 group-hover:translate-x-0.5 group-hover:text-primary"
            aria-hidden
          />
        </div>
      </div>

      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-xs text-muted-foreground">{t("portfolio.card.investment_amount")}</dt>
          <dd className="mt-0.5 font-semibold tabular-nums text-foreground">
            <CurrencyDisplay
              amountMinor={Number(investment.principalMinor)}
              currency={investment.currency}
            />
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">
            {isActiveLike ? t("portfolio.card.live_earnings") : t("portfolio.card.roi_credited")}
          </dt>
          <dd className="mt-0.5 font-semibold tabular-nums text-foreground">
            <CurrencyDisplay
              amountMinor={Number(totalEarningsMinor)}
              currency={investment.currency}
            />
          </dd>
        </div>
        {isActiveLike ? (
          <>
            <div>
              <dt className="text-xs text-muted-foreground">{t("portfolio.card.today_live")}</dt>
              <dd className="mt-0.5 font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                <CurrencyDisplay
                  amountMinor={Number(todayEarningsMinor)}
                  currency={investment.currency}
                />
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{t("portfolio.card.current_value")}</dt>
              <dd className="mt-0.5 font-semibold tabular-nums text-foreground">
                <CurrencyDisplay
                  amountMinor={Number(currentValueMinor)}
                  currency={investment.currency}
                />
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">
                {t("portfolio.card.days_remaining")}
              </dt>
              <dd className="mt-0.5 font-semibold tabular-nums text-foreground">
                {remainingDaysLabel(investment.maturityDate, t)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{t("portfolio.card.maturity_date")}</dt>
              <dd className="mt-0.5 text-sm font-semibold text-foreground">
                {investment.maturityDate ? <DateDisplay value={investment.maturityDate} /> : "—"}
              </dd>
            </div>
          </>
        ) : (
          <>
            <div>
              <dt className="text-xs text-muted-foreground">{t("portfolio.card.start_date")}</dt>
              <dd className="mt-0.5 text-sm font-medium text-foreground">
                {investment.activatedAt || investment.startAt ? (
                  <DateDisplay value={investment.activatedAt ?? investment.startAt!} />
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{t("portfolio.card.matures")}</dt>
              <dd className="mt-0.5 text-sm font-medium text-foreground">
                {investment.maturityDate ? <DateDisplay value={investment.maturityDate} /> : "—"}
              </dd>
            </div>
          </>
        )}
      </dl>

      {isActiveLike && live ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            {t("portfolio.card.daily_roi")}{" "}
            <span className="tabular-nums text-foreground">
              {((investment.dailyRoiBps ?? 0) / 100).toFixed(2)}%
            </span>
          </span>
          <span>
            {t("portfolio.card.next_settlement")}{" "}
            <span className="font-mono tabular-nums text-foreground">
              {formatCountdown(live.nextSettlementCountdownSeconds)}
            </span>
          </span>
          <span>
            {t("portfolio.card.remaining")} {remainingDaysLabel(investment.maturityDate, t)}
          </span>
        </div>
      ) : null}

      {progress !== null ? (
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
            <span>{t("portfolio.card.progress")}</span>
            <span className="tabular-nums">
              {t("portfolio.card.progress_term", { progress, days: investment.termDays })}
            </span>
          </div>
          <Progress
            value={progress}
            className={cn(
              isActiveLike && "[&_[data-slot=progress-indicator]]:bg-emerald-500",
              investment.status === "matured" && "[&_[data-slot=progress-indicator]]:bg-sky-500",
            )}
            aria-label={t("portfolio.card.progress_aria", { progress })}
          />
        </div>
      ) : (
        <p className="mt-4 text-xs text-muted-foreground">{t("portfolio.card.progress_pending")}</p>
      )}

      <div className="mt-4 rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {t("portfolio.card.what_next")}
        </p>
        <p className="mt-1 text-sm text-foreground">
          {investment.nextMilestone.label}
          {investment.nextMilestone.date ? (
            <>
              {" · "}
              <DateDisplay value={investment.nextMilestone.date} />
            </>
          ) : null}
        </p>
      </div>
    </Link>
  );
}
