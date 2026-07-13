"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Landmark } from "lucide-react";

import { Button, EmptyState, Skeleton, StatusChip } from "@/components/ui";
import { CurrencyDisplay, DateDisplay } from "@/components/ui/display";
import { getCustomerJson } from "@/features/customer/api-client";
import { presentDepositStatus } from "@/features/customer/wallet/status-presentation";
import type { WalletDeposit } from "@/features/customer/wallet/types";

export function DepositHistory() {
  const [deposits, setDeposits] = useState<WalletDeposit[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void getCustomerJson<{ deposits: WalletDeposit[] }>("/api/customer/deposits").then(
      (result) => {
        if (!active) return;
        if (result.error) {
          setError(result.error);
          setLoading(false);
          return;
        }
        setDeposits(result.data?.deposits ?? []);
        setLoading(false);
      },
    );
    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  if (loading) {
    return <Skeleton className="h-40 w-full rounded-xl" aria-label="Loading deposits" />;
  }

  if (deposits.length === 0) {
    return (
      <EmptyState
        icon={Landmark}
        title="No deposits yet"
        description="Funding history stays here after you add funds. Deposits feel safe — not instant."
        action={
          <Button asChild>
            <Link href="/wallet/deposits/new">Add funds</Link>
          </Button>
        }
      />
    );
  }

  return (
    <ul className="divide-y divide-border/70 rounded-xl border border-border/80">
      {deposits.map((deposit) => {
        const status = presentDepositStatus(deposit.status);
        return (
          <li key={deposit.id}>
            <Link
              href={`/wallet/deposits/${deposit.id}`}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-muted/30"
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  <CurrencyDisplay amountMinor={Number(deposit.amountMinor)} />
                </p>
                <p className="text-xs text-muted-foreground">
                  <DateDisplay value={deposit.createdAt} />
                </p>
              </div>
              <StatusChip tone={status.tone}>{status.label}</StatusChip>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
