"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, Lock, PiggyBank, Wallet } from "lucide-react";

import { Button, EmptyState, Skeleton } from "@/components/ui";
import { StatCard } from "@/components/ui/stat-card";
import { getCustomerJson } from "@/features/customer/api-client";
import { WalletQuickActions } from "@/features/customer/wallet/wallet-quick-actions";
import { WalletWelcomeHero } from "@/features/customer/wallet/wallet-welcome-hero";
import type { WalletOverviewResponse } from "@/features/customer/wallet/types";

function formatMinorCurrency(amountMinor: string, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(Number(amountMinor) / 100);
}

/** WP1 — wallet shell: hero, balance hierarchy, navigation, empty state. */
export function WalletOverview() {
  const [data, setData] = useState<WalletOverviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void getCustomerJson<WalletOverviewResponse>("/api/customer/wallet").then((result) => {
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
    });
    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return (
      <div className="space-y-8">
        <WalletWelcomeHero />
        <section className="rounded-xl border border-destructive/40 bg-destructive/5 p-6">
          <h2 className="text-base font-semibold text-destructive">Wallet unavailable</h2>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/contact">Contact support</Link>
          </Button>
        </section>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="space-y-8" aria-busy="true" aria-label="Loading wallet">
        <Skeleton className="h-36 w-full rounded-2xl" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-8 w-24 rounded-lg" />
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const { balances } = data;
  const currency = balances.currency || "USD";
  const isEmpty =
    balances.availableBalanceMinor === "0" &&
    balances.pendingBalanceMinor === "0" &&
    balances.lockedBalanceMinor === "0" &&
    balances.reservedBalanceMinor === "0" &&
    data.recentActivity.length === 0;

  return (
    <div className="space-y-8">
      <p className="sr-only">Primary question: How do I safely move money?</p>
      <WalletWelcomeHero />
      <WalletQuickActions />

      <section aria-label="Balance hierarchy">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Available"
            value={formatMinorCurrency(balances.availableBalanceMinor, currency)}
            description="Withdrawable now equals Available from the certified ledger."
            icon={<Wallet />}
            href="/wallet/withdrawals/new"
            accent="emerald"
          />
          <StatCard
            title="Withdrawable"
            value={formatMinorCurrency(balances.withdrawableBalanceMinor, currency)}
            description="Same certified available balance — shown for clarity."
            icon={<PiggyBank />}
            href="/wallet/withdrawals/new"
            accent="sky"
          />
          <StatCard
            title="Pending"
            value={formatMinorCurrency(balances.pendingBalanceMinor, currency)}
            description={
              data.pendingDepositCount > 0
                ? `${data.pendingDepositCount} deposit(s) not final yet.`
                : "Funds awaiting confirmation."
            }
            icon={<Clock />}
            href="/wallet/deposits"
            accent="amber"
          />
          <StatCard
            title="Invested"
            value={formatMinorCurrency(balances.lockedBalanceMinor, currency)}
            description={
              balances.reservedBalanceMinor !== "0"
                ? `Includes reserved for withdrawal (${formatMinorCurrency(balances.reservedBalanceMinor, currency)}).`
                : "Locked in investments or platform rules."
            }
            icon={<Lock />}
            href="/portfolio"
            accent="violet"
          />
        </div>
      </section>

      {isEmpty ? (
        <EmptyState
          icon={Wallet}
          title="Your wallet is ready"
          description="Add funds when you’re ready. Deposits feel safe — not rushed. Accrued investment earnings are not Available until credited."
          action={
            <Button asChild>
              <Link href="/wallet/deposits/new">Add funds</Link>
            </Button>
          }
        />
      ) : null}

      <section className="rounded-xl border border-border/60 bg-muted/20 p-5">
        <h2 className="text-sm font-semibold text-foreground">Balance vocabulary</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Accrued earnings live on Portfolio — they never look like Available here.
        </p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          {data.vocabulary.map((term) => (
            <div key={term.id}>
              <dt className="text-sm font-medium text-foreground">{term.label}</dt>
              <dd className="text-sm text-muted-foreground">{term.customerWording}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
