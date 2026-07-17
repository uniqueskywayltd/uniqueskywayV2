"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ScrollText } from "lucide-react";

import { Button, EmptyState, Skeleton } from "@/components/ui";
import { DashboardPanelCard } from "@/components/ui/dashboard-panel-card";
import { getCustomerJson } from "@/features/customer/api-client";
import { useI18n } from "@/features/i18n/i18n-provider";
import { LedgerTransactionTable } from "@/features/customer/wallet/ledger-transaction-list";
import type { LedgerEntryRow } from "@/features/customer/wallet/types";

const PREVIEW_LIMIT = 6;

interface LedgerPayload {
  currency: string;
  entries: LedgerEntryRow[];
}

/** WP4 — recent wallet transactions from certified ledger read model only. */
export function WalletLedgerPreview() {
  const { t } = useI18n();
  const [ledger, setLedger] = useState<LedgerPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void getCustomerJson<LedgerPayload>("/api/customer/ledger").then((result) => {
      if (!active) return;
      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }
      setLedger(result.data ?? null);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <section aria-busy="true" aria-label={t("wallet.loading_recent_transactions")}>
        <div className="overflow-hidden rounded-xl border border-border/70 bg-card/90 shadow-sm">
          <Skeleton className="h-1 w-full rounded-none" />
          <div className="space-y-3 p-5">
            <Skeleton className="h-5 w-36 rounded-md" />
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section
        aria-label={t("wallet.recent_transactions_aria")}
        className="rounded-xl border border-destructive/40 bg-destructive/5 p-5"
      >
        <h2 className="text-base font-semibold text-destructive">
          {t("wallet.ledger_recent_unavailable")}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/ledger">{t("wallet.ledger_open_full")}</Link>
        </Button>
      </section>
    );
  }

  const entries = ledger?.entries ?? [];
  const previewEntries = entries.slice(0, PREVIEW_LIMIT);

  return (
    <section aria-label={t("wallet.recent_transactions_aria")}>
      <DashboardPanelCard title={t("activity.title")} href="/ledger" accent="sky">
        {previewEntries.length === 0 ? (
          <EmptyState
            icon={ScrollText}
            title={t("wallet.ledger_empty_title")}
            description={t("wallet.ledger_empty_body")}
            className="min-h-36 border-0 bg-transparent p-3 sm:p-4"
            action={
              <Button asChild variant="outline" size="sm">
                <Link href="/wallet/deposits/new">{t("wallet.add_funds")}</Link>
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">{t("wallet.ledger_historical_hint")}</p>
            <LedgerTransactionTable entries={previewEntries} />
            {entries.length > PREVIEW_LIMIT ? (
              <div className="flex justify-end">
                <Button asChild variant="ghost" size="sm">
                  <Link href="/ledger">
                    {t("wallet.ledger_view_full", { count: entries.length })}
                  </Link>
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </DashboardPanelCard>
    </section>
  );
}
