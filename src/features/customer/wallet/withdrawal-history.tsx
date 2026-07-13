"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Banknote } from "lucide-react";

import { Button, EmptyState, Skeleton, StatusChip } from "@/components/ui";
import { CurrencyDisplay, DateDisplay } from "@/components/ui/display";
import { getCustomerJson } from "@/features/customer/api-client";
import { presentWithdrawalStatus } from "@/features/customer/wallet/status-presentation";
import type { WalletWithdrawal } from "@/features/customer/wallet/types";

export function WithdrawalHistory() {
  const [withdrawals, setWithdrawals] = useState<WalletWithdrawal[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void getCustomerJson<{ withdrawals: WalletWithdrawal[] }>("/api/customer/withdrawals").then(
      (result) => {
        if (!active) return;
        if (result.error) {
          setError(result.error);
          setLoading(false);
          return;
        }
        setWithdrawals(result.data?.withdrawals ?? []);
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
    return <Skeleton className="h-40 w-full rounded-xl" aria-label="Loading withdrawals" />;
  }

  if (withdrawals.length === 0) {
    return (
      <EmptyState
        icon={Banknote}
        title="No withdrawals yet"
        description="When you request a withdrawal, status and next steps stay visible so you always know what happens next."
        action={
          <Button asChild>
            <Link href="/wallet/withdrawals/new">Withdraw</Link>
          </Button>
        }
      />
    );
  }

  return (
    <ul className="divide-y divide-border/70 rounded-xl border border-border/80">
      {withdrawals.map((withdrawal) => {
        const status = presentWithdrawalStatus(withdrawal.status);
        return (
          <li key={withdrawal.id}>
            <Link
              href={`/wallet/withdrawals/${withdrawal.id}`}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-muted/30"
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  <CurrencyDisplay amountMinor={Number(withdrawal.amountMinor)} />
                </p>
                <p className="text-xs text-muted-foreground">
                  <DateDisplay value={withdrawal.createdAt} />
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
