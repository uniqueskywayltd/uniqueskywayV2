"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Search } from "lucide-react";

import { Button, EmptyState, Skeleton } from "@/components/ui";
import { CurrencyDisplay, DateDisplay } from "@/components/ui/display";
import { getCustomerJson } from "@/features/customer/api-client";
import { useI18n } from "@/features/i18n/i18n-provider";
import type {
  StatementListItem,
  StatementListResponse,
  StatementType,
} from "@/features/customer/statements/types";

const TYPE_FILTER_KEYS: Array<{ id: "all" | StatementType; labelKey: string }> = [
  { id: "all", labelKey: "statements.filter.all" },
  { id: "monthly", labelKey: "statements.filter.monthly" },
  { id: "wallet", labelKey: "statements.filter.wallet" },
  { id: "investment", labelKey: "statements.filter.investment" },
];

export function StatementsExplorer() {
  const { t } = useI18n();
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
        <h2 className="text-base font-semibold">{t("statements.unavailable")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/account/help">{t("statements.open_help")}</Link>
        </Button>
      </section>
    );
  }

  return (
    <div className="space-y-8">
      <p className="sr-only">{t("statements.sr_question")}</p>
      <section className="rounded-xl border border-border/80 p-5">
        <div className="flex items-start gap-3">
          <FileText className="mt-0.5 size-5 text-muted-foreground" aria-hidden />
          <div className="space-y-2">
            <h2 className="text-base font-semibold">{t("statements.understand_title")}</h2>
            <p className="text-sm text-muted-foreground">
              {payload?.understanding ?? t("statements.default_understanding")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("statements.timezone_hint", {
                timezone: payload?.timezone ?? "America/New_York",
              })}
            </p>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label={t("nav.statements")}>
          {TYPE_FILTER_KEYS.map((item) => (
            <Button
              key={item.id}
              type="button"
              size="sm"
              variant={type === item.id ? "default" : "outline"}
              onClick={() => beginReload({ type: item.id })}
            >
              {t(item.labelKey)}
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
            {t("statements.search_label")}
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
              placeholder={t("statements.search_placeholder")}
              className="h-9 w-full rounded-md border bg-background pr-3 pl-9 text-sm"
            />
          </div>
          <Button type="submit" size="sm" variant="outline">
            {t("ui.search")}
          </Button>
        </form>
      </div>

      {loading ? (
        <Skeleton className="h-48 w-full rounded-xl" aria-label={t("ui.loading")} />
      ) : !payload || payload.statements.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={t("statements.empty_title")}
          description={payload?.emptyHint ?? t("statements.default_empty_hint")}
          action={
            <Button asChild>
              <Link href="/ledger">{t("activity.open_ledger")}</Link>
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
        <h2 className="text-base font-semibold">{t("statements.download_history")}</h2>
        {!payload || payload.downloads.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("statements.no_downloads")}</p>
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
                    {t("communications.open")}
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
  const { t } = useI18n();

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
            {row.periodBounds} · {row.statusLabel} · {row.lineCount} {t("statements.lines")}
          </p>
        </div>
        <div className="text-sm sm:text-right">
          <p>
            {t("statements.credits")}{" "}
            <CurrencyDisplay amountMinor={Number(row.creditTotalMinor)} className="font-medium" />
          </p>
          <p className="text-muted-foreground">
            {t("statements.debits")}{" "}
            <CurrencyDisplay amountMinor={Number(row.debitTotalMinor)} className="font-medium" />
          </p>
        </div>
      </Link>
    </li>
  );
}
