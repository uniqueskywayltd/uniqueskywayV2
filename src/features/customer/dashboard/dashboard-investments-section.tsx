"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PieChart } from "lucide-react";

import { Button, EmptyState, Skeleton, StatusChip } from "@/components/ui";
import { DashboardPanelCard } from "@/components/ui/dashboard-panel-card";
import { CurrencyDisplay, DateDisplay } from "@/components/ui/display";
import { Progress } from "@/components/ui/progress";
import { getCustomerJson } from "@/features/customer/api-client";
import { presentInvestmentStatus } from "@/features/customer/portfolio/status-presentation";
import type {
  PortfolioInvestmentCard,
  PortfolioListResponse,
} from "@/features/customer/portfolio/types";
import { useI18n } from "@/features/i18n/i18n-provider";
import { cn } from "@/lib/utils";

const DISPLAY_LIMIT = 4;

/** Calendar countdown from a certified maturity date — not financial math. */
function daysUntil(date: string | null, now = new Date()): number | null {
  if (!date) return null;
  const end = new Date(`${date}T23:59:59.999Z`).getTime();
  if (Number.isNaN(end)) return null;
  const ms = end - now.getTime();
  if (ms <= 0) return 0;
  return Math.ceil(ms / 86_400_000);
}

/** DP4 — investment navigator widgets from certified portfolio read models only. */
export function DashboardInvestmentsSection() {
  const { t } = useI18n();
  const [data, setData] = useState<PortfolioListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    void getCustomerJson<PortfolioListResponse>(
      "/api/customer/investments?bucket=all&sort=newest",
    ).then((result) => {
      if (!active) return;
      setError(result.error ?? null);
      setData(result.data ?? null);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label={t("ui.loading")}>
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-36 w-full rounded-xl" />
        <Skeleton className="h-36 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <p className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
        {t("dashboard.investments.load_error")} {error}
      </p>
    );
  }

  const activeInvestments = data.investments.filter((item) =>
    ["active", "maturing"].includes(item.status),
  );
  const pendingInvestments = data.investments.filter((item) => item.status === "pending");
  const featured = [...activeInvestments, ...pendingInvestments].slice(0, DISPLAY_LIMIT);
  const activeCount = (data.summary.byStatus.active ?? 0) + (data.summary.byStatus.maturing ?? 0);
  const byStatus = data.summary.byStatus;

  const statusLabels: Record<string, string> = {
    active: t("status.investment.active"),
    maturing: t("status.investment.maturing"),
    pending: t("dashboard.investments.status_activating"),
    matured: t("status.investment.matured"),
  };

  return (
    <section className="space-y-4" aria-label={t("dashboard.investments.title")}>
      <DashboardPanelCard
        title={t("dashboard.investments.title")}
        href="/portfolio"
        accent="violet"
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">
              {t("dashboard.investments.active_principal")}
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">
              <CurrencyDisplay amountMinor={Number(data.summary.activePrincipalMinor)} />
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">
              {t("dashboard.investments.active_count")}
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">{activeCount}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("dashboard.investments.positions")}</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">
              {data.summary.totalCount}
            </p>
          </div>
        </div>

        <ul className="mt-4 flex flex-wrap gap-2" aria-label={t("ui.status")}>
          {(["active", "maturing", "pending", "matured"] as const).map((key) => {
            const count = byStatus[key] ?? 0;
            if (count === 0) return null;
            const tone = presentInvestmentStatus(key, t).tone;
            return (
              <li key={key}>
                <StatusChip tone={tone}>
                  {statusLabels[key]} · {count}
                </StatusChip>
              </li>
            );
          })}
        </ul>
      </DashboardPanelCard>

      {featured.length === 0 ? (
        <EmptyState
          icon={PieChart}
          title={t("dashboard.investments.empty_title")}
          description={t("dashboard.investments.empty_body")}
          action={
            <Button asChild>
              <Link href="/wallet/deposits/new">{t("portfolio.empty.deposit")}</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              {t("dashboard.investments.section_active")}
            </h2>
            <Button asChild variant="link" className="h-auto px-0 text-sm">
              <Link href="/portfolio">{t("dashboard.investments.view_all")}</Link>
            </Button>
          </div>
          {activeInvestments.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              {t("dashboard.investments.term_notice")}
            </p>
          ) : null}
          <div className="grid gap-4">
            {featured.map((investment) => (
              <InvestmentSummaryCard key={investment.id} investment={investment} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function InvestmentSummaryCard({ investment }: { investment: PortfolioInvestmentCard }) {
  const { t } = useI18n();
  const status = presentInvestmentStatus(investment.status, t);
  const progress = investment.progressPercent ?? 0;
  const daysLeft = daysUntil(investment.maturityDate);
  const isActiveLike = investment.status === "active" || investment.status === "maturing";

  return (
    <Link
      href={`/portfolio/${investment.id}`}
      className="block rounded-xl border border-border/70 bg-card p-4 shadow-sm motion-safe:transition-[border-color,background-color,box-shadow,transform] motion-safe:duration-200 motion-reduce:transition-none hover:border-primary/30 hover:bg-muted/20 motion-safe:hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="truncate text-base font-semibold text-foreground">{investment.planName}</p>
        <StatusChip tone={status.tone}>{status.label}</StatusChip>
      </div>

      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-xs text-muted-foreground">
            {t("dashboard.investments.card_investment")}
          </dt>
          <dd className="mt-0.5 font-semibold tabular-nums text-foreground">
            <CurrencyDisplay
              amountMinor={Number(investment.principalMinor)}
              currency={investment.currency}
            />
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">
            {isActiveLike
              ? t("dashboard.investments.days_remaining")
              : t("dashboard.investments.status_detail")}
          </dt>
          <dd className="mt-0.5 font-semibold tabular-nums text-foreground">
            {isActiveLike
              ? daysLeft === null
                ? "—"
                : daysLeft === 0
                  ? t("status.investment.matured")
                  : daysLeft
              : status.explanation}
          </dd>
        </div>
        {investment.nextMilestone.label ? (
          <div className="sm:col-span-2">
            <dt className="text-xs text-muted-foreground">{t("portfolio.card.next_settlement")}</dt>
            <dd className="mt-0.5 text-sm text-foreground">
              {investment.nextMilestone.label}
              {investment.nextMilestone.date ? (
                <>
                  {" · "}
                  <DateDisplay value={investment.nextMilestone.date} />
                </>
              ) : null}
            </dd>
          </div>
        ) : null}
        {investment.maturityDate ? (
          <div className="sm:col-span-2">
            <dt className="text-xs text-muted-foreground">{t("dashboard.investments.maturity")}</dt>
            <dd className="mt-0.5 text-sm text-foreground">
              <DateDisplay value={investment.maturityDate} />
            </dd>
          </div>
        ) : null}
      </dl>

      {investment.progressPercent !== null ? (
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
            <span>{t("dashboard.investments.progress")}</span>
            <span className="tabular-nums">{progress}%</span>
          </div>
          <Progress
            value={progress}
            className={cn(
              investment.status === "active" && "[&_[data-slot=progress-indicator]]:bg-emerald-500",
            )}
            aria-label={t("dashboard.investments.progress_aria", { percent: progress })}
          />
        </div>
      ) : null}
    </Link>
  );
}
