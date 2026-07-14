"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ScrollText } from "lucide-react";

import { Button, EmptyState, Skeleton } from "@/components/ui";
import { DashboardPanelCard } from "@/components/ui/dashboard-panel-card";
import { getCustomerJson } from "@/features/customer/api-client";
import { LedgerTransactionTable } from "@/features/customer/wallet/ledger-transaction-list";
import type { LedgerEntryRow } from "@/features/customer/wallet/types";

const PREVIEW_LIMIT = 6;

interface LedgerPayload {
  currency: string;
  entries: LedgerEntryRow[];
}

/** WP4 — recent wallet transactions from certified ledger read model only. */
export function WalletLedgerPreview() {
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
      <section aria-busy="true" aria-label="Loading recent wallet transactions">
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
        aria-label="Recent wallet transactions"
        className="rounded-xl border border-destructive/40 bg-destructive/5 p-5"
      >
        <h2 className="text-base font-semibold text-destructive">Recent transactions unavailable</h2>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/ledger">Open full ledger</Link>
        </Button>
      </section>
    );
  }

  const entries = ledger?.entries ?? [];
  const previewEntries = entries.slice(0, PREVIEW_LIMIT);

  return (
    <section aria-label="Recent wallet transactions">
      <DashboardPanelCard title="Recent activity" href="/ledger" accent="sky">
        {previewEntries.length === 0 ? (
          <EmptyState
            icon={ScrollText}
            title="No transactions yet"
            description="Posted deposits, credits, reservations, and withdrawals appear here in ledger order — never recalculated."
            className="min-h-36 border-0 bg-transparent p-3 sm:p-4"
            action={
              <Button asChild variant="outline" size="sm">
                <Link href="/wallet/deposits/new">Add funds</Link>
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Historical ledger record — each row is a certified posting, shown exactly as posted.
            </p>
            <LedgerTransactionTable entries={previewEntries} />
            {entries.length > PREVIEW_LIMIT ? (
              <div className="flex justify-end">
                <Button asChild variant="ghost" size="sm">
                  <Link href="/ledger">View full ledger ({entries.length} entries)</Link>
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </DashboardPanelCard>
    </section>
  );
}
