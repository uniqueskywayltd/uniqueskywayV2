"use client";

import { useEffect, useMemo, useState } from "react";

import { Skeleton } from "@/components/ui";
import { DashboardInvestCta } from "@/features/customer/dashboard/dashboard-invest-cta";
import { DashboardLiveEarnings } from "@/features/customer/dashboard/dashboard-live-earnings";
import { getCustomerJson } from "@/features/customer/api-client";
import type { PortfolioListResponse } from "@/features/customer/portfolio/types";
import {
  remainingDaysLabel,
  useAggregatedLiveAccrual,
  type LiveAccrualSource,
} from "@/features/customer/portfolio/use-live-accrual";

interface WalletBalancesPayload {
  balances: {
    currency: string;
    availableBalanceMinor: string;
  };
}

/**
 * Guides funded customers to invest, or surfaces live earnings when investments are active.
 * Display only — uses the existing client-side accrual engine (no DB writes).
 */
export function DashboardGrowthSurface() {
  const [wallet, setWallet] = useState<WalletBalancesPayload | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void Promise.all([
      getCustomerJson<WalletBalancesPayload>("/api/customer/wallet"),
      getCustomerJson<PortfolioListResponse>("/api/customer/investments?bucket=all&sort=newest"),
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

  const activeInvestments = useMemo(
    () =>
      (portfolio?.investments ?? []).filter(
        (item) => item.status === "active" || item.status === "maturing",
      ),
    [portfolio],
  );

  const liveSources = useMemo<LiveAccrualSource[]>(
    () =>
      activeInvestments
        .filter((item) => item.dailyRoiBps !== undefined)
        .map((item) => ({
          principalMinor: item.principalMinor,
          dailyRoiBps: item.dailyRoiBps as number,
          activatedAt: item.activatedAt,
          termDays: item.termDays,
          postedRoiMinor: item.postedRoiMinor,
          promisedRoiMinor: item.promisedRoiMinor ?? null,
          status: item.status,
        })),
    [activeInvestments],
  );

  const live = useAggregatedLiveAccrual(liveSources);

  if (loading) {
    return (
      <Skeleton className="h-44 w-full rounded-2xl" aria-label="Loading investment guidance" />
    );
  }

  if (error || !wallet || !portfolio) {
    return null;
  }

  const available = BigInt(wallet.balances.availableBalanceMinor || "0");
  const hasActiveInvestment = activeInvestments.length > 0;
  const currency = wallet.balances.currency || portfolio.summary.currency || "USD";

  if (hasActiveInvestment) {
    const fallbackToday = portfolio.summary.todayEarningsMinor ?? "0";
    const fallbackTotal =
      portfolio.summary.totalEarningsMinor ?? portfolio.summary.totalRoiMinor ?? "0";
    const fallbackValue =
      portfolio.summary.currentInvestmentValueMinor ?? portfolio.summary.activePrincipalMinor;
    const liveView = live ?? {
      todayEarningsMinor: fallbackToday,
      totalLiveEarningsMinor: fallbackTotal,
      currentValueMinor: fallbackValue,
      postedRoiMinor: portfolio.summary.totalRoiMinor ?? "0",
      nextSettlementCountdownSeconds: portfolio.summary.nextSettlementCountdownSeconds ?? 0,
      activeCount: activeInvestments.length,
      visualOnly: true as const,
    };

    const earliestMaturity = activeInvestments
      .map((item) => item.maturityDate)
      .filter((date): date is string => Boolean(date))
      .sort()[0];

    return (
      <DashboardLiveEarnings
        live={liveView}
        currency={currency}
        portfolioValueMinor={
          portfolio.summary.portfolioValueMinor ?? portfolio.summary.activePrincipalMinor
        }
        timeRemainingLabel={remainingDaysLabel(earliestMaturity ?? null)}
      />
    );
  }

  if (available > 0n) {
    return <DashboardInvestCta />;
  }

  return null;
}
