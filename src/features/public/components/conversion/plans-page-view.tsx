"use client";

import Image from "next/image";
import Link from "next/link";
import { BarChart3, Clock, Shield, Wallet } from "lucide-react";

import { InvestmentPlansSection } from "@/features/public/components/homepage/investment-plans-section";
import {
  TrustCtaBand,
  TrustPageHero,
  TrustSection,
} from "@/features/public/components/trust/trust-page";
import { section } from "@/features/public/components/marketing-ui";
import { useI18n } from "@/features/i18n/i18n-provider";
import { cn } from "@/lib/utils";

export function PlansPageView() {
  const { t } = useI18n();

  const features = [
    {
      icon: BarChart3,
      titleKey: "conversion.plans.feature.tracking.title",
      textKey: "conversion.plans.feature.tracking.text",
    },
    {
      icon: Shield,
      titleKey: "conversion.plans.feature.secure.title",
      textKey: "conversion.plans.feature.secure.text",
    },
    {
      icon: Clock,
      titleKey: "conversion.plans.feature.duration.title",
      textKey: "conversion.plans.feature.duration.text",
    },
    {
      icon: Wallet,
      titleKey: "conversion.plans.feature.withdraw.title",
      textKey: "conversion.plans.feature.withdraw.text",
    },
  ] as const;

  const lifecycleSteps = [
    {
      titleKey: "conversion.plans.lifecycle.choose",
      detailKey: "conversion.plans.lifecycle.choose_detail",
    },
    {
      titleKey: "conversion.plans.lifecycle.activate",
      detailKey: "conversion.plans.lifecycle.activate_detail",
    },
    {
      titleKey: "conversion.plans.lifecycle.track",
      detailKey: "conversion.plans.lifecycle.track_detail",
    },
    {
      titleKey: "conversion.plans.lifecycle.complete",
      detailKey: "conversion.plans.lifecycle.complete_detail",
    },
  ] as const;

  const eligibilityKeys = [
    "conversion.plans.eligibility.verified",
    "conversion.plans.eligibility.balance",
    "conversion.plans.eligibility.status",
  ] as const;

  return (
    <>
      <TrustPageHero
        purpose={t("conversion.plans.purpose")}
        eyebrow={t("conversion.plans.hero.eyebrow")}
        title={t("conversion.plans.hero.title")}
        lead={t("conversion.plans.hero.lead")}
        image="/brand/investments.webp"
        imageAlt={t("conversion.plans.image_alt")}
        align="center"
      />

      <section className={section.padding}>
        <div className={section.container}>
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-2xl">
              <Image
                src="/brand/portfolio.webp"
                alt={t("conversion.plans.portfolio_alt")}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent" />
              <div className="absolute right-6 bottom-6 left-6">
                <p className="text-lg font-medium text-white">
                  {t("conversion.plans.portfolio_title")}
                </p>
                <p className="mt-1 text-sm text-white/70">
                  {t("conversion.plans.portfolio_subtitle")}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {features.map((feature) => (
                <div
                  key={feature.titleKey}
                  className="rounded-xl border border-border/60 bg-card/50 p-5"
                >
                  <feature.icon className="mb-3 h-6 w-6 text-primary" aria-hidden />
                  <h3 className="font-medium text-foreground">{t(feature.titleKey)}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {t(feature.textKey)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <InvestmentPlansSection showCompareStrip={false} />

      <TrustSection title={t("conversion.plans.lifecycle.title")}>
        <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {lifecycleSteps.map((step, index) => (
            <li key={step.titleKey} className="min-w-0">
              <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
                {t("conversion.plans.step_label", { number: index + 1 })}
              </p>
              <p className="mt-2 text-base font-semibold text-foreground">{t(step.titleKey)}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{t(step.detailKey)}</p>
            </li>
          ))}
        </ol>
      </TrustSection>

      <TrustSection title={t("conversion.plans.eligibility.title")} className="bg-muted/30">
        <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
          {eligibilityKeys.map((key) => (
            <li key={key}>{t(key)}</li>
          ))}
        </ul>
      </TrustSection>

      <TrustSection title={t("conversion.plans.risk.title")}>
        <p>{t("conversion.plans.risk.body")}</p>
        <p className="mt-3">
          <Link
            href="/legal/risk"
            className={cn("font-medium text-foreground underline underline-offset-4")}
          >
            {t("conversion.plans.risk.label")}
          </Link>
        </p>
      </TrustSection>

      <TrustCtaBand
        title={t("conversion.plans.cta.title")}
        support={t("conversion.plans.cta.support")}
        primary={{ label: t("conversion.plans.cta.primary"), href: "/auth/register" }}
        secondary={{ label: t("conversion.plans.cta.secondary"), href: "/how-it-works" }}
      />
    </>
  );
}
