"use client";

import { Skeleton } from "@/components/ui";
import { useI18n } from "@/features/i18n/i18n-provider";
import { DashboardActivitySection } from "@/features/customer/dashboard/dashboard-activity-section";
import { useDashboardChrome } from "@/features/customer/dashboard/dashboard-chrome-context";
import { DashboardGrowthSurface } from "@/features/customer/dashboard/dashboard-growth-surface";
import { DashboardInvestmentsSection } from "@/features/customer/dashboard/dashboard-investments-section";
import { DashboardMoneyCards } from "@/features/customer/dashboard/dashboard-money-cards";
import { DashboardReveal } from "@/features/customer/dashboard/dashboard-motion";
import { DashboardQuickActions } from "@/features/customer/dashboard/dashboard-quick-actions";
import { DashboardWelcomeHero } from "@/features/customer/dashboard/dashboard-welcome-hero";
import { getPersonFullName, getPersonHandle } from "@/lib/utils/person-display";

function DashboardFrameSkeleton() {
  const { t } = useI18n();
  return (
    <div className="space-y-8" aria-busy="true" aria-label={t("dashboard.loading")}>
      <Skeleton className="h-36 w-full rounded-2xl sm:h-40" />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={`qa-${index}`} className="h-8 w-24 rounded-lg" />
        ))}
      </div>
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={`money-a-${index}`} className="h-32 w-full rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={`money-b-${index}`} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      </div>
      <Skeleton className="h-28 w-full rounded-xl" />
      <div className="grid gap-4">
        <Skeleton className="h-36 w-full rounded-xl" />
        <Skeleton className="h-36 w-full rounded-xl" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-[240px] w-full rounded-xl" />
        <Skeleton className="h-[240px] w-full rounded-xl" />
      </div>
    </div>
  );
}

/** DP1–DP5: certified dashboard surface (frame → money → investments → activity + polish). */
export function DashboardView() {
  const { summary, loaded } = useDashboardChrome();

  if (!loaded || !summary) {
    return <DashboardFrameSkeleton />;
  }

  return (
    <div className="space-y-8 sm:space-y-9">
      <DashboardReveal>
        <DashboardWelcomeHero
          fullName={getPersonFullName(summary)}
          handle={getPersonHandle(summary)}
          avatarUrl={summary.profile?.avatarUrl ?? null}
        />
      </DashboardReveal>
      <DashboardReveal delayMs={40}>
        <DashboardQuickActions />
      </DashboardReveal>
      <DashboardReveal delayMs={70}>
        <DashboardGrowthSurface />
      </DashboardReveal>
      <DashboardReveal delayMs={100}>
        <DashboardMoneyCards />
      </DashboardReveal>
      <DashboardReveal delayMs={140}>
        <DashboardInvestmentsSection />
      </DashboardReveal>
      <DashboardReveal delayMs={180}>
        <DashboardActivitySection />
      </DashboardReveal>
      <p className="sr-only">Primary question: How am I doing today?</p>
    </div>
  );
}
