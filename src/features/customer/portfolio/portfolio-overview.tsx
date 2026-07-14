"use client";

import { useDeferredValue, useEffect, useState } from "react";
import Link from "next/link";
import { PieChart } from "lucide-react";

import { Button, EmptyState, Input, Skeleton, StatusChip } from "@/components/ui";
import { CurrencyDisplay } from "@/components/ui/display";
import { getCustomerJson } from "@/features/customer/api-client";
import { presentInvestmentStatus } from "@/features/customer/portfolio/status-presentation";
import { PortfolioQuickActions } from "@/features/customer/portfolio/portfolio-quick-actions";
import { PortfolioWelcomeHero } from "@/features/customer/portfolio/portfolio-welcome-hero";
import type {
  PortfolioInvestmentCard,
  PortfolioListResponse,
} from "@/features/customer/portfolio/types";
import { cn } from "@/lib/utils";

const BUCKETS = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "active", label: "Active" },
  { id: "completed", label: "Completed" },
  { id: "archived", label: "Archived" },
] as const;

const SORTS = [
  { id: "newest", label: "Newest" },
  { id: "maturity", label: "Maturity soonest" },
  { id: "status", label: "Status" },
] as const;

function PortfolioFrameSkeleton() {
  return (
    <div className="space-y-8 sm:space-y-9" aria-busy="true" aria-label="Loading investments">
      <Skeleton className="h-36 w-full rounded-2xl sm:h-40" />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={`nav-${index}`} className="h-8 w-28 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-20 w-full rounded-xl" />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={`filter-${index}`} className="h-8 w-20 rounded-lg" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    </div>
  );
}

/** PF1 — portfolio shell: hero, navigation, filters, empty state (cards preserved for PF2). */
export function PortfolioOverview() {
  const [bucket, setBucket] = useState<(typeof BUCKETS)[number]["id"]>("all");
  const [sort, setSort] = useState<(typeof SORTS)[number]["id"]>("newest");
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
      bucket: (typeof BUCKETS)[number]["id"];
      sort: (typeof SORTS)[number]["id"];
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
    return <PortfolioFrameSkeleton />;
  }

  return (
    <div className="space-y-8 sm:space-y-9">
      <p className="sr-only">Primary question: How are my investments performing?</p>

      <PortfolioWelcomeHero />
      <PortfolioQuickActions />

      {error && !data ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5" role="alert">
          <p className="text-sm font-semibold text-foreground">We couldn’t load your investments.</p>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={() => beginReload({ bucket: "all", query: "" })}
          >
            Reset filters and retry
          </Button>
        </div>
      ) : null}

      {data ? (
        <PortfolioOrientation summary={data.summary} />
      ) : loading ? (
        <Skeleton className="h-20 w-full rounded-xl" />
      ) : null}

      <section aria-label="Investment filters" className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div
            className="flex flex-wrap gap-2"
            role="tablist"
            aria-label="Filter investments by status"
          >
            {BUCKETS.map((item) => {
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
            <div className="w-full sm:w-56">
              <label htmlFor="portfolio-search" className="sr-only">
                Search investments
              </label>
              <Input
                id="portfolio-search"
                type="search"
                placeholder="Search investments…"
                value={query}
                onChange={(event) => beginReload({ query: event.target.value })}
                autoComplete="off"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              Sort
              <select
                className="h-9 rounded-lg border border-input bg-background px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={sort}
                onChange={(event) =>
                  beginReload({ sort: event.target.value as (typeof SORTS)[number]["id"] })
                }
              >
                {SORTS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </section>

      {error && data ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5" role="alert">
          <p className="text-sm font-semibold text-foreground">Refresh failed.</p>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
        </div>
      ) : null}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2" aria-busy="true" aria-label="Loading positions">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      ) : null}

      {!loading && !error && data && data.investments.length === 0 ? (
        <PortfolioEmptyState
          hasPortfolio={data.summary.totalCount > 0}
          onClear={() => beginReload({ bucket: "all", query: "" })}
        />
      ) : null}

      {/* PF2 will rebuild investment cards; keep certified binding until then. */}
      {!loading && data && data.investments.length > 0 ? (
        <ul className="grid gap-4 md:grid-cols-2" aria-label="Investment positions">
          {data.investments.map((investment) => (
            <li key={investment.id}>
              <InvestmentCardBridge investment={investment} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** Orientation from certified list summary only — not dashboard widgets. */
function PortfolioOrientation({
  summary,
}: {
  summary: PortfolioListResponse["summary"];
}) {
  const activeCount = (summary.byStatus.active ?? 0) + (summary.byStatus.maturing ?? 0);

  return (
    <section
      aria-label="Portfolio summary"
      className="grid gap-3 rounded-xl border border-border/70 bg-muted/20 p-4 sm:grid-cols-3 sm:p-5"
    >
      <div>
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Positions
        </p>
        <p className="mt-1 font-mono text-lg tabular-nums text-foreground">{summary.totalCount}</p>
      </div>
      <div>
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Active</p>
        <p className="mt-1 font-mono text-lg tabular-nums text-foreground">{activeCount}</p>
      </div>
      <div>
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Active principal
        </p>
        <p className="mt-1 text-foreground">
          <CurrencyDisplay amountMinor={Number(summary.activePrincipalMinor)} />
        </p>
      </div>
    </section>
  );
}

/** Temporary bridge card — full card redesign is PF2. */
function InvestmentCardBridge({ investment }: { investment: PortfolioInvestmentCard }) {
  const status = presentInvestmentStatus(investment.status);

  return (
    <article className="flex h-full flex-col rounded-xl border border-border/70 bg-card/90 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            What is this?
          </p>
          <h2 className="mt-1 text-base font-semibold text-foreground">{investment.planName}</h2>
        </div>
        <StatusChip tone={status.tone}>{status.label}</StatusChip>
      </div>

      <dl className="mt-4 grid gap-3 text-sm">
        <div>
          <dt className="text-muted-foreground">Principal</dt>
          <dd className="mt-1 font-medium text-foreground">
            <CurrencyDisplay
              amountMinor={Number(investment.principalMinor)}
              currency={investment.currency}
            />
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">ROI credited</dt>
          <dd className="mt-1 font-medium text-foreground">
            <CurrencyDisplay
              amountMinor={Number(investment.postedRoiMinor)}
              currency={investment.currency}
            />
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Progress</dt>
          <dd className="mt-2">
            <div
              className="h-2 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={investment.progressPercent ?? 0}
              aria-label={`Progress ${investment.progressPercent ?? 0}%`}
            >
              <div
                className="h-full rounded-full bg-violet-500/80"
                style={{ width: `${investment.progressPercent ?? 0}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {investment.progressPercent === null
                ? "Progress available after activation dates post."
                : `${investment.progressPercent}% toward maturity · ${investment.termDays} day term`}
            </p>
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">What happens next?</dt>
          <dd className="mt-1 text-foreground">
            {investment.nextMilestone.label}
            {investment.nextMilestone.date ? ` · ${investment.nextMilestone.date}` : null}
          </dd>
        </div>
      </dl>

      <div className="mt-5 grow" />
      <Button asChild variant="outline" className="w-full focus-visible:ring-offset-2">
        <Link href={`/portfolio/${investment.id}`}>View details</Link>
      </Button>
    </article>
  );
}

function PortfolioEmptyState({
  hasPortfolio,
  onClear,
}: {
  hasPortfolio: boolean;
  onClear: () => void;
}) {
  if (hasPortfolio) {
    return (
      <EmptyState
        icon={PieChart}
        title="No matches"
        description="Try a different status filter or clear search to see your investments again."
        action={
          <Button type="button" variant="outline" onClick={onClear}>
            Clear filters
          </Button>
        }
      />
    );
  }

  return (
    <EmptyState
      icon={PieChart}
      title="No investments yet"
      description="When you activate a published plan, it appears here with progress and settlement cues — Portfolio is where performance lives."
      action={
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/plans">Explore plans</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/wallet">Open wallet</Link>
          </Button>
        </div>
      }
    />
  );
}
