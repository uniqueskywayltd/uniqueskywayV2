"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Search } from "lucide-react";

import { Button, EmptyState, Skeleton } from "@/components/ui";
import { CurrencyDisplay, DateDisplay } from "@/components/ui/display";
import { getCustomerJson } from "@/features/customer/api-client";
import type {
  StatementListItem,
  StatementListResponse,
  StatementType,
} from "@/features/customer/statements/types";

const TYPE_FILTERS: Array<{ id: "all" | StatementType; label: string }> = [
  { id: "all", label: "All" },
  { id: "monthly", label: "Monthly" },
  { id: "wallet", label: "Wallet" },
  { id: "investment", label: "Investment" },
];

export function StatementsExplorer() {
  const [type, setType] = useState<"all" | StatementType>("all");
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [payload, setPayload] = useState<StatementListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams();
    if (type !== "all") params.set("type", type);
    if (query.trim()) params.set("q", query.trim());
    const url = `/api/customer/statements${params.size ? `?${params}` : ""}`;

    void getCustomerJson<StatementListResponse>(url).then((result) => {
      if (!active) return;
      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }
      setPayload(result.data ?? null);
      setError(null);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [type, query]);

  function beginReload(next?: { type?: "all" | StatementType; query?: string }) {
    setLoading(true);
    setError(null);
    if (next?.type !== undefined) setType(next.type);
    if (next?.query !== undefined) setQuery(next.query);
  }

  if (error) {
    return (
      <section className="rounded-xl border border-border/80 p-6">
        <h2 className="text-base font-semibold">Statements unavailable</h2>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/account/help">Open Help</Link>
        </Button>
      </section>
    );
  }

  return (
    <div className="space-y-8">
      <p className="sr-only">Primary question: Can I understand my financial history?</p>
      <section className="rounded-xl border border-border/80 p-5">
        <div className="flex items-start gap-3">
          <FileText className="mt-0.5 size-5 text-muted-foreground" aria-hidden />
          <div className="space-y-2">
            <h2 className="text-base font-semibold">Understand your history</h2>
            <p className="text-sm text-muted-foreground">
              {payload?.understanding ??
                "Statements project certified ledger postings by New York calendar month."}
            </p>
            <p className="text-xs text-muted-foreground">
              Timezone: {payload?.timezone ?? "America/New_York"} (financial calendar)
            </p>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Statement type">
          {TYPE_FILTERS.map((item) => (
            <Button
              key={item.id}
              type="button"
              size="sm"
              variant={type === item.id ? "default" : "outline"}
              onClick={() => beginReload({ type: item.id })}
            >
              {item.label}
            </Button>
          ))}
        </div>
        <form
          className="flex w-full max-w-sm gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            beginReload({ query: q });
          }}
        >
          <label className="sr-only" htmlFor="statement-search">
            Search statements
          </label>
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              id="statement-search"
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Search period or type"
              className="h-9 w-full rounded-md border bg-background pr-3 pl-9 text-sm"
            />
          </div>
          <Button type="submit" size="sm" variant="outline">
            Search
          </Button>
        </form>
      </div>

      {loading ? (
        <Skeleton className="h-48 w-full rounded-xl" aria-label="Loading statements" />
      ) : !payload || payload.statements.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No statements yet"
          description={
            payload?.emptyHint ??
            "When deposits, ROI, or withdrawals post, New York months appear here."
          }
          action={
            <Button asChild>
              <Link href="/ledger">Open ledger</Link>
            </Button>
          }
        />
      ) : (
        <ul className="divide-y divide-border/70 rounded-xl border border-border/80">
          {payload.statements.map((row) => (
            <StatementListRow key={row.id} row={row} />
          ))}
        </ul>
      )}

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Download history</h2>
        {!payload || payload.downloads.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No downloads yet. Open a statement and download CSV when you need a copy.
          </p>
        ) : (
          <ul className="divide-y divide-border/70 rounded-xl border border-border/80">
            {payload.downloads.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium">{row.statementId}</p>
                  <p className="text-xs text-muted-foreground">
                    <DateDisplay value={row.downloadedAt} />
                  </p>
                </div>
                <Button asChild variant="link" className="h-auto px-0">
                  <Link href={`/account/statements/${encodeURIComponent(row.statementId)}`}>
                    Open
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatementListRow({ row }: { row: StatementListItem }) {
  return (
    <li>
      <Link
        href={row.href}
        className="flex flex-col gap-2 px-4 py-4 hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <p className="text-sm font-medium text-foreground">
            {row.periodLabel} · {row.typeLabel}
          </p>
          <p className="text-xs text-muted-foreground">
            {row.periodBounds} · {row.statusLabel} · {row.lineCount} lines
          </p>
        </div>
        <div className="text-sm sm:text-right">
          <p>
            Credits{" "}
            <CurrencyDisplay amountMinor={Number(row.creditTotalMinor)} className="font-medium" />
          </p>
          <p className="text-muted-foreground">
            Debits{" "}
            <CurrencyDisplay amountMinor={Number(row.debitTotalMinor)} className="font-medium" />
          </p>
        </div>
      </Link>
    </li>
  );
}
