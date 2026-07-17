"use client";

import { useEffect, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  BriefcaseBusiness,
  Lock,
  PiggyBank,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { Skeleton } from "@/components/ui";
import { StatCard } from "@/components/ui/stat-card";
import { getCustomerJson } from "@/features/customer/api-client";
import type { PortfolioListResponse } from "@/features/customer/portfolio/types";
import { useI18n } from "@/features/i18n/i18n-provider";
import { formatMoneyMinorUnits } from "@/lib/money-format";

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

/** DP2 — money cards bound to certified wallet + portfolio read models only. */
export function DashboardMoneyCards() {
  const { t, language } = useI18n();
  const [wallet, setWallet] = useState<WalletOverviewPayload | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioListResponse["summary"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    void Promise.all([
      getCustomerJson<WalletOverviewPayload>("/api/customer/wallet"),
      getCustomerJson<PortfolioListResponse>("/api/customer/investments?bucket=all&sort=newest"),
    ]).then(([walletResult, portfolioResult]) => {
      if (!active) return;
      setError(walletResult.error ?? portfolioResult.error ?? null);
      setWallet(walletResult.data ?? null);
      setPortfolio(portfolioResult.data?.summary ?? null);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  function formatMinorCurrency(amountMinor: string, currency: string) {
    return formatMoneyMinorUnits(language, amountMinor, currency, 2);
  }

  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label={t("ui.loading")}>
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
        {t("dashboard.money.load_error")} {error}
      </p>
    );
  }

  const currency = wallet.balances.currency || portfolio.currency || "USD";
  const activeCount = (portfolio.byStatus.active ?? 0) + (portfolio.byStatus.maturing ?? 0);
  const lockedDescription =
    wallet.balances.reservedBalanceMinor !== "0"
      ? t("dashboard.money.invested_reserved", {
          amount: formatMinorCurrency(wallet.balances.reservedBalanceMinor, currency),
        })
      : t("dashboard.money.invested_desc");
  const todayEarnings = portfolio.todayEarningsMinor ?? "0";
  const totalRoi = portfolio.totalEarningsMinor ?? portfolio.totalRoiMinor ?? "0";
  const portfolioValue = portfolio.portfolioValueMinor ?? portfolio.activePrincipalMinor ?? "0";

  return (
    <div className="space-y-6">
      <section aria-label={t("portfolio.summary.current_value")}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title={t("dashboard.money.current_value")}
            value={formatMinorCurrency(portfolioValue, currency)}
            description={t("dashboard.money.current_value_desc")}
            icon={<Wallet />}
            href="/portfolio"
            accent="violet"
          />
          <StatCard
            title={t("dashboard.money.available_cash")}
            value={formatMinorCurrency(wallet.balances.availableBalanceMinor, currency)}
            description={
              wallet.balances.availableBalanceMinor === "0"
                ? t("dashboard.money.available_invested")
                : t("dashboard.money.available_ready")
            }
            icon={<PiggyBank />}
            href="/wallet"
            accent="primary"
          />
          <StatCard
            title={t("dashboard.money.invested_principal")}
            value={formatMinorCurrency(wallet.balances.lockedBalanceMinor, currency)}
            description={lockedDescription}
            icon={<Lock />}
            href="/portfolio"
            accent="amber"
          />
          <StatCard
            title={t("dashboard.money.today_live")}
            value={formatMinorCurrency(todayEarnings, currency)}
            description={t("dashboard.money.today_live_desc")}
            icon={<TrendingUp />}
            href="/portfolio"
            accent="emerald"
          />
        </div>
      </section>

      <section aria-label={t("dashboard.money.total_earnings")}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title={t("dashboard.money.total_roi")}
            value={formatMinorCurrency(totalRoi, currency)}
            description={t("dashboard.money.total_roi_desc")}
            icon={<TrendingUp />}
            href="/portfolio"
            accent="emerald"
          />
          <StatCard
            title={t("dashboard.money.active_investments")}
            value={String(activeCount)}
            description={t("dashboard.money.active_desc")}
            icon={<BriefcaseBusiness />}
            href="/portfolio"
            accent="violet"
          />
          <StatCard
            title={t("dashboard.money.pending_deposits")}
            value={String(wallet.pendingDepositCount)}
            description={t("dashboard.money.pending_deposits_desc")}
            icon={<ArrowDownLeft />}
            href="/wallet/deposits"
            accent="sky"
          />
          <StatCard
            title={t("dashboard.money.pending_withdrawals")}
            value={String(wallet.openWithdrawalCount)}
            description={t("dashboard.money.pending_withdrawals_desc")}
            icon={<ArrowUpRight />}
            href="/wallet/withdrawals"
            accent="sky"
          />
        </div>
      </section>
    </div>
  );
}
