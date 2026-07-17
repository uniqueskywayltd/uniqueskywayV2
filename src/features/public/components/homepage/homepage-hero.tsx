"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BarChart3, LogIn } from "lucide-react";

import { brandAssets } from "@/features/brand";
import { useI18n } from "@/features/i18n/i18n-provider";
import {
  marketingGhostLink,
  marketingOutlineBtn,
  marketingPrimaryBtn,
} from "@/features/public/components/marketing-ui";
import { cn } from "@/lib/utils";

const HERO_IMAGE = "/brand/financial-planning.webp";

export function HomepageHero() {
  const { t } = useI18n();

  const portfolioSnapshot = [
    { value: "$24,850", labelKey: "home.hero.mock.portfolio" as const, positive: false },
    { value: "+$127", labelKey: "home.hero.mock.today" as const, positive: true },
    { value: "$3,420", labelKey: "home.hero.mock.available" as const, positive: false },
  ];

  return (
    <section
      className="relative overflow-hidden bg-gradient-to-b from-sky-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950"
      aria-label={t("home.hero.banner_aria")}
    >
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-white/92 via-white/88 to-slate-50/95 dark:from-slate-950/92 dark:via-slate-900/88 dark:to-slate-950/95" />

      <div className="mx-auto w-full max-w-7xl px-4 pt-12 pb-20 sm:px-6 sm:pt-14 sm:pb-24 lg:px-8 lg:pt-16 lg:pb-28">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16 xl:gap-20">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-start">
            <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">
              {t("home.hero.established")} · {t("footer.location_city")}
            </p>

            <h1 className="mt-6 max-w-[18ch] text-4xl font-semibold leading-[1.12] tracking-tight text-slate-900 sm:text-5xl lg:max-w-[14ch] lg:text-[3.25rem] dark:text-slate-50">
              {t("home.hero.title")}
            </h1>

            <p className="mt-8 max-w-md text-base leading-relaxed text-slate-700 sm:text-lg dark:text-slate-300">
              {t("home.hero.lead")}
            </p>

            <div className="mt-10 flex w-full max-w-md flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center lg:justify-start">
              <Link href="/auth/register" className={cn(marketingPrimaryBtn(), "w-full sm:w-auto")}>
                {t("home.hero.cta_invest")}
                <ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180" aria-hidden />
              </Link>
              <Link href="/auth/login" className={cn(marketingOutlineBtn(), "w-full sm:w-auto")}>
                <LogIn className="me-2 h-4 w-4" aria-hidden />
                {t("home.hero.cta_signin")}
              </Link>
            </div>

            <Link href="/plans" className={cn(marketingGhostLink(), "mt-5")}>
              {t("home.plans.eyebrow")}
              <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden />
            </Link>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-900/5 dark:border-border dark:bg-card dark:shadow-lg dark:ring-border/50"
              aria-label={t("home.hero.preview_aria")}
            >
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-5 dark:border-border dark:bg-muted/50">
                <div className="flex items-center gap-2.5">
                  <Image src={brandAssets.icon} alt="" width={22} height={22} className="rounded" />
                  <div>
                    <p className="text-xs font-medium text-foreground">
                      {t("home.hero.mock.dashboard")}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {t("home.hero.mock.overview")}
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
                  {t("home.hero.mock.active")}
                </span>
              </div>

              <div className="relative aspect-[16/11] w-full sm:aspect-[16/10]">
                <Image
                  src={HERO_IMAGE}
                  alt={t("home.hero.image_alt")}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/55 via-transparent to-transparent" />
                <div className="absolute top-3 end-3 rounded-lg border border-white/30 bg-white/95 px-3 py-2.5 shadow-md backdrop-blur-sm sm:top-4 sm:end-4 dark:border-border/60 dark:bg-card/95">
                  <div className="flex items-center gap-2">
                    <BarChart3
                      className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
                      aria-hidden
                    />
                    <div>
                      <p className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                        {t("home.hero.mock.ytd")}
                      </p>
                      <p className="text-base font-semibold tabular-nums text-foreground">+24.8%</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 divide-x divide-slate-200 border-t border-slate-200 bg-white dark:divide-border dark:border-border dark:bg-card rtl:divide-x-reverse">
                {portfolioSnapshot.map((item) => (
                  <div key={item.labelKey} className="px-2 py-3.5 text-center sm:px-4 sm:py-4">
                    <p
                      className={cn(
                        "text-sm font-semibold tabular-nums sm:text-base",
                        item.positive
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-foreground",
                      )}
                    >
                      {item.value}
                    </p>
                    <p className="mt-0.5 text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                      {t(item.labelKey)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
