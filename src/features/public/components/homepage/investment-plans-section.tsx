"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { CertifiedPlanCard } from "@/features/public/components/certified-plan-card";
import {
  CERTIFIED_PUBLIC_PLANS,
  type CertifiedPublicPlan,
} from "@/features/public/content/certified-plans";
import { useI18n } from "@/features/i18n/i18n-provider";
import { marketingOutlineBtn, section } from "@/features/public/components/marketing-ui";
import { cn } from "@/lib/utils";

type InvestmentPlansSectionProps = {
  plans?: readonly CertifiedPublicPlan[];
  compareHref?: string;
  showCompareStrip?: boolean;
};

export function InvestmentPlansSection({
  plans = CERTIFIED_PUBLIC_PLANS,
  compareHref = "/plans",
  showCompareStrip = true,
}: InvestmentPlansSectionProps) {
  const { t } = useI18n();

  return (
    <section
      className="relative overflow-hidden border-y border-border/60 bg-background"
      aria-label={t("home.plans.section_label")}
    >
      <div className={cn(section.container, section.padding)}>
        <div className="mx-auto max-w-2xl text-center">
          <p className={section.eyebrow}>{t("home.plans.eyebrow")}</p>
          <h2 className={section.heading}>{t("home.plans.structured_title")}</h2>
          <p className={cn(section.body, "mx-auto text-center")}>
            {t("home.plans.structured_body")}
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:mt-14 sm:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => (
            <CertifiedPlanCard key={plan.slug} plan={plan} />
          ))}
        </div>

        {showCompareStrip ? (
          <div className="mx-auto mt-10 flex max-w-3xl flex-col items-center justify-between gap-4 border border-border/70 px-6 py-5 sm:mt-12 sm:flex-row sm:px-7">
            <p className="text-center text-sm text-muted-foreground sm:text-left">
              {t("home.plans.compare_strip")}
            </p>
            <Link
              href={compareHref}
              className={cn(marketingOutlineBtn("shrink-0"), "justify-center")}
            >
              {t("home.plans.full_details")}
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
