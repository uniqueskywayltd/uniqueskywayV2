"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, Lock, PiggyBank, Wallet } from "lucide-react";

import { Button, EmptyState, Skeleton } from "@/components/ui";
import { StatCard } from "@/components/ui/stat-card";
import { getCustomerJson } from "@/features/customer/api-client";
import { WalletLedgerPreview } from "@/features/customer/wallet/wallet-ledger-preview";
import { WalletReveal } from "@/features/customer/wallet/wallet-motion";
import { WalletQuickActions } from "@/features/customer/wallet/wallet-quick-actions";
import { WalletWelcomeHero } from "@/features/customer/wallet/wallet-welcome-hero";
import type { WalletOverviewResponse } from "@/features/customer/wallet/types";
import { formatMoneyMinorUnits } from "@/lib/money-format";

function formatMinorCurrency(amountMinor: string, currency: string) {
  return formatMoneyMinorUnits("en", amountMinor, currency, 2);
}

function WalletFrameSkeleton() {
  return (
    <div className="space-y-8 sm:space-y-9" aria-busy="true" aria-label="Loading wallet">
      <Skeleton className="h-36 w-full rounded-2xl sm:h-40" />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={`nav-${index}`} className="h-8 w-24 rounded-lg" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={`bal-${index}`} className="h-32 w-full rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-[280px] w-full rounded-xl" />
      <Skeleton className="h-36 w-full rounded-xl" />
    </div>
  );
}

/** WP1–WP5: certified wallet surface (shell → money movement → ledger + polish). */
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
      <div className="space-y-8 sm:space-y-9">
        <WalletWelcomeHero />
        <section
          className="rounded-xl border border-destructive/40 bg-destructive/5 p-6"
          role="alert"
        >
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
    return <WalletFrameSkeleton />;
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
    <div className="space-y-8 sm:space-y-9">
      <p className="sr-only">
        Primary questions: What money is available? What is pending? What just happened? What can I
        do next?
      </p>

      <WalletReveal>
        <WalletWelcomeHero />
      </WalletReveal>

      <WalletReveal delayMs={40}>
        <WalletQuickActions />
      </WalletReveal>

      <WalletReveal delayMs={80}>
        <section aria-label="Balance hierarchy">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Available"
              value={formatMinorCurrency(balances.availableBalanceMinor, currency)}
              description="Ready to invest or withdraw."
              icon={<Wallet />}
              href="/wallet/withdrawals/new"
              accent="emerald"
            />
            <StatCard
              title="Withdrawable"
              value={formatMinorCurrency(balances.withdrawableBalanceMinor, currency)}
              description="Cash you can send out now."
              icon={<PiggyBank />}
              href="/wallet/withdrawals/new"
              accent="sky"
            />
            <StatCard
              title="Pending"
              value={formatMinorCurrency(balances.pendingBalanceMinor, currency)}
              description={
                data.pendingDepositCount > 0
                  ? `${data.pendingDepositCount} deposit(s) still settling.`
                  : "Funds still settling."
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
                  ? `Includes a withdrawal hold (${formatMinorCurrency(balances.reservedBalanceMinor, currency)}).`
                  : "In investments or other holds."
              }
              icon={<Lock />}
              href="/portfolio"
              accent="violet"
            />
          </div>
        </section>
      </WalletReveal>

      <WalletReveal delayMs={120}>
        <WalletLedgerPreview />
      </WalletReveal>

      {isEmpty ? (
        <WalletReveal delayMs={140}>
          <EmptyState
            icon={Wallet}
            title="Your wallet is ready"
            description="Add funds when you’re ready—no rush. Accrued investment earnings stay on Investments until they post here."
            action={
              <Button asChild>
                <Link href="/wallet/deposits/new">Add funds</Link>
              </Button>
            }
          />
        </WalletReveal>
      ) : null}

      <WalletReveal delayMs={160}>
        <section
          className="rounded-xl border border-border/60 bg-muted/20 p-5 sm:p-6"
          aria-label="Balance vocabulary"
        >
          <h2 className="text-sm font-semibold text-foreground">Balance vocabulary</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Accrued earnings live on Investments — they never look like Available here.
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
      </WalletReveal>
    </div>
  );
}
