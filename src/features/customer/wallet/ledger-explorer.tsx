"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookOpenText } from "lucide-react";

import { Button, EmptyState, Input, Skeleton } from "@/components/ui";
import { getCustomerJson } from "@/features/customer/api-client";
import { useI18n } from "@/features/i18n/i18n-provider";
import { LedgerTransactionList } from "@/features/customer/wallet/ledger-transaction-list";
import type { LedgerEntryRow } from "@/features/customer/wallet/types";

/** Full ledger — certified history with client-side search/filters (V1 parity). */
export function LedgerExplorer() {
  const { t } = useI18n();
  const [entries, setEntries] = useState<LedgerEntryRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    let active = true;
    void getCustomerJson<{ entries: LedgerEntryRow[] }>("/api/customer/ledger").then((result) => {
      if (!active) return;
      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }
      setEntries(result.data?.entries ?? []);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const transactionTypes = useMemo(() => {
    const set = new Set(entries.map((entry) => entry.transactionType));
    return ["all", ...Array.from(set).sort()];
  }, [entries]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return entries.filter((entry) => {
      if (typeFilter !== "all" && entry.transactionType !== typeFilter) return false;
      if (!needle) return true;
      return (
        entry.label.toLowerCase().includes(needle) ||
        entry.transactionType.toLowerCase().includes(needle) ||
        entry.referenceType.toLowerCase().includes(needle) ||
        entry.referenceId.toLowerCase().includes(needle) ||
        (entry.description?.toLowerCase().includes(needle) ?? false)
      );
    });
  }, [entries, query, typeFilter]);

  if (error) {
    return (
      <section className="rounded-xl border border-border/80 p-6">
        <h2 className="text-base font-semibold">{t("wallet.ledger_unavailable")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/contact">{t("wallet.contact_support")}</Link>
        </Button>
      </section>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label={t("wallet.loading_ledger")}>
        <Skeleton className="h-5 w-full max-w-xl rounded-md" />
        <div className="space-y-2 rounded-xl border border-border/70 p-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={BookOpenText}
        title={t("wallet.ledger_explorer_empty_title")}
        description={t("wallet.ledger_explorer_empty_body")}
        action={
          <Button asChild>
            <Link href="/wallet/deposits/new">{t("wallet.add_funds")}</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <p className="sr-only">{t("wallet.ledger_explorer_question")}</p>
      <p className="text-sm text-muted-foreground">{t("wallet.ledger_explorer_hint")}</p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="block flex-1 space-y-1.5 text-sm">
          <span className="font-medium text-foreground">{t("ui.search")}</span>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("wallet.ledger_search_placeholder")}
            autoComplete="off"
          />
        </label>
        <label className="block space-y-1.5 text-sm sm:w-56">
          <span className="font-medium text-foreground">{t("ui.type")}</span>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
          >
            {transactionTypes.map((type) => (
              <option key={type} value={type}>
                {type === "all" ? t("wallet.ledger_all_types") : type}
              </option>
            ))}
          </select>
        </label>
      </div>
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("wallet.ledger_no_filter_match")}</p>
      ) : (
        <LedgerTransactionList entries={filtered} />
      )}
    </div>
  );
}
