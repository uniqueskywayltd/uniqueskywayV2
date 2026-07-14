"use client";

import { useEffect, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  BriefcaseBusiness,
  Clock,
  Lock,
  PiggyBank,
  Wallet,
} from "lucide-react";

import { Skeleton } from "@/components/ui";
import { StatCard } from "@/components/ui/stat-card";
import { getCustomerJson } from "@/features/customer/api-client";

interface WalletOverviewPayload {
  balances: {
    currency: string;
    availableBalanceMinor: string;
    pendingBalanceMinor: string;
    lockedBalanceMinor: string;
    reservedBalanceMinor: string;
  };
  pendingDepositCount: number;
  openWithdrawalCount: number;
}

interface PortfolioListPayload {
  summary: {
    totalCount: number;
    activePrincipalMinor: string;
    byStatus: Record<string, number>;
  };
}

function formatMinorCurrency(amountMinor: string, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(Number(amountMinor) / 100);
}

/** DP2 — money cards bound to certified wallet + portfolio read models only. */
export function DashboardMoneyCards() {
  const [wallet, setWallet] = useState<WalletOverviewPayload | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioListPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    void Promise.all([
      getCustomerJson<WalletOverviewPayload>("/api/customer/wallet"),
      getCustomerJson<PortfolioListPayload>("/api/customer/investments?bucket=all&sort=newest"),
    ]).then(([walletResult, portfolioResult]) => {
      if (!active) return;
      setError(walletResult.error ?? portfolioResult.error ?? null);
      setWallet(walletResult.data ?? null);
      setPortfolio(portfolioResult.data ?? null);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading money cards">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={`portfolio-skel-${index}`} className="h-32 w-full rounded-lg" />
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={`status-skel-${index}`} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !wallet || !portfolio) {
    return (
      <p className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
        Money cards could not load. Open Wallet or Portfolio directly, or refresh. {error}
      </p>
    );
  }

  const currency = wallet.balances.currency || "USD";
  const activeCount =
    (portfolio.summary.byStatus.active ?? 0) + (portfolio.summary.byStatus.maturing ?? 0);
  const lockedDescription =
    wallet.balances.reservedBalanceMinor !== "0"
      ? `Includes reserved for withdrawal (${formatMinorCurrency(wallet.balances.reservedBalanceMinor, currency)}).`
      : "Principal currently locked in active investments.";

  return (
    <div className="space-y-6">
      <section aria-label="Portfolio balances">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Portfolio value"
            value={formatMinorCurrency(portfolio.summary.activePrincipalMinor, currency)}
            description="Active principal from certified investments."
            icon={<Wallet />}
            href="/portfolio"
            accent="violet"
          />
          <StatCard
            title="Available balance"
            value={formatMinorCurrency(wallet.balances.availableBalanceMinor, currency)}
            description="Withdrawable now from the certified ledger."
            icon={<PiggyBank />}
            href="/wallet"
            accent="emerald"
          />
          <StatCard
            title="Locked balance"
            value={formatMinorCurrency(wallet.balances.lockedBalanceMinor, currency)}
            description={lockedDescription}
            icon={<Lock />}
            href="/portfolio"
            accent="amber"
          />
          <StatCard
            title="Pending balance"
            value={formatMinorCurrency(wallet.balances.pendingBalanceMinor, currency)}
            description="Funds not yet available — awaiting confirmation."
            icon={<Clock />}
            href="/wallet"
            accent="sky"
          />
        </div>
      </section>

      <section aria-label="Investment summary">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Active investments"
            value={String(activeCount)}
            description="Investments currently active or maturing."
            icon={<BriefcaseBusiness />}
            href="/portfolio"
            accent="violet"
          />
          <StatCard
            title="Portfolio positions"
            value={String(portfolio.summary.totalCount)}
            description="All certified investment records."
            icon={<Wallet />}
            href="/portfolio"
            accent="primary"
          />
          <StatCard
            title="Pending deposits"
            value={String(wallet.pendingDepositCount)}
            description="Deposit intents awaiting confirmation."
            icon={<ArrowDownLeft />}
            href="/wallet/deposits"
            accent="sky"
          />
          <StatCard
            title="Open withdrawals"
            value={String(wallet.openWithdrawalCount)}
            description="Withdrawal requests still in progress."
            icon={<ArrowUpRight />}
            href="/wallet/withdrawals"
            accent="rose"
          />
        </div>
      </section>
    </div>
  );
}
