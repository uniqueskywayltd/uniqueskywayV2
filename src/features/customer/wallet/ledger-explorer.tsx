"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpenText } from "lucide-react";

import { Button, EmptyState, Skeleton } from "@/components/ui";
import { CurrencyDisplay, DateDisplay } from "@/components/ui/display";
import { getCustomerJson } from "@/features/customer/api-client";
import type { LedgerEntryRow } from "@/features/customer/wallet/types";

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
    return <Skeleton className="h-48 w-full rounded-xl" aria-label="Loading ledger" />;
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
      <ul className="divide-y divide-border/70 rounded-xl border border-border/80">
        {entries.map((entry) => {
          const content = (
            <>
              <div>
                <p className="text-sm font-medium text-foreground">{entry.label}</p>
                <p className="text-xs text-muted-foreground">
                  <DateDisplay value={entry.postedAt} /> · {entry.walletCategory}
                </p>
              </div>
              <CurrencyDisplay
                amountMinor={Number(entry.amountMinor)}
                className="text-sm font-medium"
              />
            </>
          );

          return (
            <li key={entry.id}>
              {entry.href ? (
                <Link
                  href={entry.href}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-muted/30"
                >
                  {content}
                </Link>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  {content}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
