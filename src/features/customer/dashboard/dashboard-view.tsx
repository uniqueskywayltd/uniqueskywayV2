"use client";

import { Skeleton } from "@/components/ui";
import { DashboardActivitySection } from "@/features/customer/dashboard/dashboard-activity-section";
import { useDashboardChrome } from "@/features/customer/dashboard/dashboard-chrome-context";
import { DashboardInvestmentsSection } from "@/features/customer/dashboard/dashboard-investments-section";
import { DashboardMoneyCards } from "@/features/customer/dashboard/dashboard-money-cards";
import { DashboardQuickActions } from "@/features/customer/dashboard/dashboard-quick-actions";
import { DashboardWelcomeHero } from "@/features/customer/dashboard/dashboard-welcome-hero";
import {
  getPersonFullName,
  getPersonHandle,
} from "@/lib/utils/person-display";

/** DP1–DP4: frame, money, investments, activity. DP5 polish deferred. */
export function DashboardView() {
  const { summary, loaded } = useDashboardChrome();

  if (!loaded || !summary) {
    return (
      <div className="space-y-8" aria-busy="true" aria-label="Loading dashboard">
        <Skeleton className="h-36 w-full rounded-2xl" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-7 w-24 rounded-lg" />
          <Skeleton className="h-7 w-24 rounded-lg" />
          <Skeleton className="h-7 w-28 rounded-lg" />
          <Skeleton className="h-7 w-20 rounded-lg" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <DashboardWelcomeHero
        fullName={getPersonFullName(summary)}
        handle={getPersonHandle(summary)}
        avatarUrl={summary.profile?.avatarUrl ?? null}
      />
      <DashboardQuickActions />
      <DashboardMoneyCards />
      <DashboardInvestmentsSection />
      <DashboardActivitySection />
      <p className="sr-only">Primary question: How am I doing today?</p>
    </div>
  );
}
