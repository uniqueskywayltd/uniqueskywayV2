"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PieChart, Search } from "lucide-react";

import { Button, EmptyState, Input, Skeleton } from "@/components/ui";
import { CurrencyDisplay } from "@/components/ui/display";
import { getCustomerJson } from "@/features/customer/api-client";
import { InvestmentCard } from "@/features/customer/portfolio/investment-card";
import { PortfolioReveal } from "@/features/customer/portfolio/portfolio-motion";
import { PortfolioQuickActions } from "@/features/customer/portfolio/portfolio-quick-actions";
import { PortfolioStatusDistribution } from "@/features/customer/portfolio/portfolio-status-distribution";
import { PortfolioWelcomeHero } from "@/features/customer/portfolio/portfolio-welcome-hero";
import type { PortfolioListResponse } from "@/features/customer/portfolio/types";
import { useI18n } from "@/features/i18n/i18n-provider";
import { cn } from "@/lib/utils";

const BUCKET_IDS = ["all", "pending", "active", "completed", "archived"] as const;
const SORT_IDS = ["newest", "maturity", "status"] as const;

type BucketId = (typeof BUCKET_IDS)[number];
type SortId = (typeof SORT_IDS)[number];

function PortfolioFrameSkeleton({ loadingLabel }: { loadingLabel: string }) {
  return (
    <div className="space-y-8 sm:space-y-9" aria-busy="true" aria-label={loadingLabel}>
      <Skeleton className="h-36 w-full rounded-2xl sm:h-40" />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={`nav-${index}`} className="h-8 w-28 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-28 w-full rounded-xl" />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={`filter-${index}`} className="h-8 w-20 rounded-lg" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}

/** PF1–PF5: certified portfolio surface (shell → cards → detail link → status counts + polish). */
export function PortfolioOverview() {
  const { t } = useI18n();
  const buckets = useMemo(
    () =>
      BUCKET_IDS.map((id) => ({
        id,
        label: t(
          id === "all"
            ? "portfolio.filter.all"
            : id === "pending"
              ? "portfolio.filter.pending"
              : id === "active"
                ? "portfolio.filter.active"
                : id === "completed"
                  ? "portfolio.filter.completed"
                  : "portfolio.filter.archived",
        ),
      })),
    [t],
  );
  const sorts = useMemo(
    () =>
      SORT_IDS.map((id) => ({
        id,
        label: t(
          id === "newest"
            ? "portfolio.sort.newest"
            : id === "maturity"
              ? "portfolio.sort.maturity"
              : "portfolio.sort.status",
        ),
      })),
    [t],
  );

  const [bucket, setBucket] = useState<BucketId>("all");
  const [sort, setSort] = useState<SortId>("newest");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [data, setData] = useState<PortfolioListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    let active = true;

    const params = new URLSearchParams({
      bucket,
      sort,
      ...(deferredQuery.trim() ? { q: deferredQuery.trim() } : {}),
    });

    void getCustomerJson<PortfolioListResponse>(`/api/customer/investments?${params}`).then(
      (result) => {
        if (!active) return;
        if (result.error) {
          setError(result.error);
          setData(null);
          setLoading(false);
          setInitialLoad(false);
          return;
        }
        setError(null);
        setData(result.data ?? null);
        setLoading(false);
        setInitialLoad(false);
      },
    );

    return () => {
      active = false;
    };
  }, [bucket, sort, deferredQuery]);

  function beginReload(
    next?: Partial<{
      bucket: BucketId;
      sort: SortId;
      query: string;
    }>,
  ) {
    setLoading(true);
    setError(null);
    if (next?.bucket !== undefined) setBucket(next.bucket);
    if (next?.sort !== undefined) setSort(next.sort);
    if (next?.query !== undefined) setQuery(next.query);
  }

  if (initialLoad && loading && !data) {
    return <PortfolioFrameSkeleton loadingLabel={t("portfolio.loading.investments")} />;
  }

  const resultCount = data?.investments.length ?? 0;

  return (
    <div className="space-y-8 sm:space-y-9">
      <p className="sr-only">{t("portfolio.hero.primary_question")}</p>

      <PortfolioReveal>
        <PortfolioWelcomeHero />
      </PortfolioReveal>

      <PortfolioReveal delayMs={40}>
        <PortfolioQuickActions />
      </PortfolioReveal>

      {error && !data ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5" role="alert">
          <p className="text-sm font-semibold text-foreground">{t("portfolio.error.load_title")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={() => beginReload({ bucket: "all", query: "" })}
          >
            {t("portfolio.error.reset_retry")}
          </Button>
        </div>
      ) : null}

      <PortfolioReveal delayMs={80}>
        {data ? (
          <div className="space-y-4">
            <PortfolioOrientation summary={data.summary} />
            <PortfolioStatusDistribution byStatus={data.summary.byStatus} />
          </div>
        ) : loading ? (
          <div className="space-y-3" aria-busy="true" aria-label={t("portfolio.loading.summary")}>
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>
        ) : null}
      </PortfolioReveal>

      <PortfolioReveal delayMs={120}>
        <section aria-label={t("portfolio.filters.aria")} className="space-y-3">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div
              className="flex flex-wrap gap-2"
              role="tablist"
              aria-label={t("portfolio.filter.aria")}
            >
              {buckets.map((item) => {
                const selected = bucket === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => beginReload({ bucket: item.id })}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-sm motion-safe:transition-colors motion-safe:duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      selected
                        ? "border-primary/30 bg-primary/10 font-medium text-primary"
                        : "border-border/70 bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                    )}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-60">
                <Search
                  className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <label htmlFor="portfolio-search" className="sr-only">
                  {t("portfolio.search.label")}
                </label>
                <Input
                  id="portfolio-search"
                  type="search"
                  placeholder={t("portfolio.search.placeholder")}
                  value={query}
                  onChange={(event) => beginReload({ query: event.target.value })}
                  autoComplete="off"
                  className="pl-9"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="shrink-0">{t("portfolio.sort.by")}</span>
                <select
                  className="h-9 min-w-[10.5rem] rounded-lg border border-input bg-background px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={sort}
                  aria-label={t("portfolio.sort.aria")}
                  onChange={(event) => beginReload({ sort: event.target.value as SortId })}
                >
                  {sorts.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {data && !loading ? (
            <p className="text-xs text-muted-foreground" aria-live="polite">
              {resultCount === 1
                ? t("portfolio.results.one")
                : t("portfolio.results.many", { count: resultCount })}
              {deferredQuery.trim()
                ? t("portfolio.results.for_query", { query: deferredQuery.trim() })
                : null}
            </p>
          ) : null}
        </section>
      </PortfolioReveal>

      {error && data ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5" role="alert">
          <p className="text-sm font-semibold text-foreground">
            {t("portfolio.error.refresh_failed")}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
        </div>
      ) : null}

      {loading ? (
        <div
          className="grid gap-4 md:grid-cols-2"
          aria-busy="true"
          aria-label={t("portfolio.loading.positions")}
        >
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : null}

      <PortfolioReveal delayMs={160}>
        {!loading && !error && data && data.investments.length === 0 ? (
          <PortfolioEmptyState
            hasPortfolio={data.summary.totalCount > 0}
            onClear={() => beginReload({ bucket: "all", query: "" })}
          />
        ) : null}

        {!loading && data && data.investments.length > 0 ? (
          <ul className="grid gap-4 md:grid-cols-2" aria-label={t("portfolio.positions.aria")}>
            {data.investments.map((investment) => (
              <li key={investment.id}>
                <InvestmentCard investment={investment} />
              </li>
            ))}
          </ul>
        ) : null}
      </PortfolioReveal>
    </div>
  );
}

/** Orientation from certified list summary only — not dashboard widgets. */
function PortfolioOrientation({ summary }: { summary: PortfolioListResponse["summary"] }) {
  const { t } = useI18n();
  const activeCount = (summary.byStatus.active ?? 0) + (summary.byStatus.maturing ?? 0);
  const currency = summary.currency ?? "USD";

  return (
    <section
      aria-label={t("portfolio.summary.aria")}
      className="grid gap-3 rounded-xl border border-border/70 bg-muted/20 p-4 sm:grid-cols-2 lg:grid-cols-4 sm:p-5"
    >
      <div>
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {t("portfolio.summary.current_value")}
        </p>
        <p className="mt-1 text-foreground">
          <CurrencyDisplay
            amountMinor={Number(summary.portfolioValueMinor ?? summary.activePrincipalMinor)}
            currency={currency}
          />
        </p>
      </div>
      <div>
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {t("portfolio.summary.available_cash")}
        </p>
        <p className="mt-1 text-foreground">
          <CurrencyDisplay
            amountMinor={Number(summary.availableBalanceMinor ?? 0)}
            currency={currency}
          />
        </p>
      </div>
      <div>
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {t("portfolio.summary.invested_principal")}
        </p>
        <p className="mt-1 text-foreground">
          <CurrencyDisplay
            amountMinor={Number(summary.lockedBalanceMinor ?? summary.activePrincipalMinor)}
            currency={currency}
          />
        </p>
      </div>
      <div>
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {t("portfolio.summary.today_live")}
        </p>
        <p className="mt-1 text-foreground">
          <CurrencyDisplay
            amountMinor={Number(summary.todayEarningsMinor ?? 0)}
            currency={currency}
          />
        </p>
      </div>
      <div>
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {t("portfolio.summary.total_earnings")}
        </p>
        <p className="mt-1 text-foreground">
          <CurrencyDisplay
            amountMinor={Number(summary.totalEarningsMinor ?? summary.totalRoiMinor ?? 0)}
            currency={currency}
          />
        </p>
      </div>
      <div>
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {t("portfolio.summary.current_value")}
        </p>
        <p className="mt-1 text-foreground">
          <CurrencyDisplay
            amountMinor={Number(
              summary.currentInvestmentValueMinor ?? summary.activePrincipalMinor,
            )}
            currency={currency}
          />
        </p>
      </div>
      <div>
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {t("portfolio.summary.positions")}
        </p>
        <p className="mt-1 font-mono text-lg tabular-nums text-foreground">
          {summary.positionsCount ?? summary.totalCount}
          <span className="ml-2 text-sm font-sans text-muted-foreground">
            {t("portfolio.summary.active_count", { count: activeCount })}
          </span>
        </p>
      </div>
      <div>
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {t("portfolio.summary.open_pending")}
        </p>
        <p className="mt-1 text-sm text-foreground">
          {t("portfolio.summary.withdrawals_deposits", {
            withdrawals: summary.openWithdrawals ?? 0,
            deposits: summary.pendingDeposits ?? 0,
          })}
        </p>
      </div>
    </section>
  );
}

function PortfolioEmptyState({
  hasPortfolio,
  onClear,
}: {
  hasPortfolio: boolean;
  onClear: () => void;
}) {
  const { t } = useI18n();

  if (hasPortfolio) {
    return (
      <EmptyState
        icon={PieChart}
        title={t("portfolio.empty.no_matches.title")}
        description={t("portfolio.empty.no_matches.body")}
        action={
          <Button type="button" variant="outline" onClick={onClear}>
            {t("portfolio.empty.clear_filters")}
          </Button>
        }
      />
    );
  }

  return (
    <EmptyState
      icon={PieChart}
      title={t("portfolio.empty.title")}
      description={t("portfolio.empty.body")}
      action={
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/wallet/deposits/new">{t("portfolio.empty.deposit")}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/plans">{t("portfolio.empty.explore")}</Link>
          </Button>
        </div>
      }
    />
  );
}
