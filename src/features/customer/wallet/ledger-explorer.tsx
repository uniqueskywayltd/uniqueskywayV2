"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpenText } from "lucide-react";

import { Button, EmptyState, Skeleton } from "@/components/ui";
import { getCustomerJson } from "@/features/customer/api-client";
import { LedgerTransactionList } from "@/features/customer/wallet/ledger-transaction-list";
import type { LedgerEntryRow } from "@/features/customer/wallet/types";

/** Full ledger — certified history only; no search (API has no query params). */
export function LedgerExplorer() {
  const [entries, setEntries] = useState<LedgerEntryRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (error) {
    return (
      <section className="rounded-xl border border-border/80 p-6">
        <h2 className="text-base font-semibold">Ledger unavailable</h2>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/contact">Contact support</Link>
        </Button>
      </section>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading ledger">
        <Skeleton className="h-5 w-full max-w-md rounded-md" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={BookOpenText}
        title="No ledger entries yet"
        description="Credited deposits, ROI, reservations, and withdrawals appear here after they post — never invented."
        action={
          <Button asChild>
            <Link href="/wallet/deposits/new">Add funds</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <p className="sr-only">Primary question: What exactly happened?</p>
      <p className="text-sm text-muted-foreground">
        The ledger is an historical record, not a financial summary. Entries appear in certified
        posting order — nothing is hidden, merged, or reordered here.
      </p>
      <LedgerTransactionList entries={entries} />
    </div>
  );
}
