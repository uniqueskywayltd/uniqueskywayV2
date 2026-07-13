"use client";

import { useDeferredValue, useEffect, useState } from "react";
import Link from "next/link";

import { Button, Input, Skeleton, StatusChip } from "@/components/ui";
import { CurrencyDisplay } from "@/components/ui/display";
import { getCustomerJson } from "@/features/customer/api-client";
import { presentInvestmentStatus } from "@/features/customer/portfolio/status-presentation";
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

export function PortfolioExplorer() {
  const [bucket, setBucket] = useState<(typeof BUCKETS)[number]["id"]>("all");
  const [sort, setSort] = useState<(typeof SORTS)[number]["id"]>("newest");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [data, setData] = useState<PortfolioListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-6">
      <p className="sr-only">Primary question: Where is my money?</p>

      {data ? (
        <PortfolioSummaryBar summary={data.summary} />
      ) : loading ? (
        <Skeleton className="h-20 w-full rounded-xl" />
      ) : null}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div
          className="flex flex-wrap gap-2"
          role="tablist"
          aria-label="Portfolio filters"
        >
          {BUCKETS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={bucket === item.id}
              onClick={() => beginReload({ bucket: item.id })}
              className={cn(
                "rounded-md border px-3 py-1.5 text-sm transition-colors",
                bucket === item.id
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:bg-muted",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="w-full sm:w-56">
            <label htmlFor="portfolio-search" className="sr-only">
              Search portfolio
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
              className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground"
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

      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5" role="alert">
          <p className="text-sm font-semibold text-foreground">We couldn’t load your portfolio.</p>
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

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2" aria-busy="true">
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

      {!loading && data && data.investments.length > 0 ? (
        <ul className="grid gap-4 md:grid-cols-2">
          {data.investments.map((investment) => (
            <li key={investment.id}>
              <InvestmentCard investment={investment} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function PortfolioSummaryBar({
  summary,
}: {
  summary: PortfolioListResponse["summary"];
}) {
  const activeCount = (summary.byStatus.active ?? 0) + (summary.byStatus.maturing ?? 0);

  return (
    <section
      aria-label="Portfolio summary"
      className="grid gap-3 rounded-xl border border-border/80 bg-muted/20 p-4 sm:grid-cols-3"
    >
      <div>
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Investments
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

function InvestmentCard({ investment }: { investment: PortfolioInvestmentCard }) {
  const status = presentInvestmentStatus(investment.status);

  return (
    <article className="flex h-full flex-col rounded-xl border border-border/80 bg-background p-5 shadow-[var(--elevation-1)]">
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
                className="h-full rounded-full bg-foreground/80"
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
      <Button asChild variant="outline" className="w-full">
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
      <section className="rounded-xl border border-border/80 p-6">
        <h2 className="text-base font-semibold text-foreground">No matches</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Try a different filter or clear search to see your investments again.
        </p>
        <Button type="button" variant="outline" className="mt-4" onClick={onClear}>
          Clear filters
        </Button>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-border/80 p-6">
      <h2 className="text-base font-semibold text-foreground">No investments yet</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        When you activate a published plan, it will appear here with progress and settlement cues.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/plans">Explore plans</Link>
        </Button>
      </div>
    </section>
  );
}
