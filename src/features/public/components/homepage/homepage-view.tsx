"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Award, Globe2, Shield, Users } from "lucide-react";

import { HomepageHero } from "@/features/public/components/homepage/homepage-hero";
import { HomepageTestimonials } from "@/features/public/components/homepage/homepage-testimonials";
import { InvestmentPlansSection } from "@/features/public/components/homepage/investment-plans-section";
import {
  card,
  marketingOutlineBtn,
  marketingPrimaryBtn,
  section,
} from "@/features/public/components/marketing-ui";
import { useI18n } from "@/features/i18n/i18n-provider";
import { cn } from "@/lib/utils";

const homepageStats = [
  { labelKey: "home.stats.aum", value: "$250M+", suffixKey: null },
  { labelKey: "home.stats.investors", value: "8,930+", suffixKey: null },
  { labelKey: "home.stats.years", value: "9+", suffixKey: "home.stats.years_suffix" },
  { labelKey: "home.stats.access", value: "24/7", suffixKey: null },
] as const;

const practiceAreas = [
  {
    image: "/brand/banking.webp",
    altKey: "home.alt.banking",
    titleKey: "home.service.banking",
    descriptionKey: "home.service.banking_desc",
    tagKey: "home.service.tag.core",
    href: "/services",
  },
  {
    image: "/brand/real-estate.webp",
    altKey: "home.alt.real_estate",
    titleKey: "home.service.real_estate",
    descriptionKey: "home.service.real_estate_desc",
    tagKey: "home.service.tag.assets",
    href: "/services",
  },
  {
    image: "/brand/global-markets.webp",
    altKey: "home.alt.markets",
    titleKey: "home.service.markets",
    descriptionKey: "home.service.markets_desc",
    tagKey: "home.service.tag.global",
    href: "/services",
  },
  {
    image: "/brand/advisory.webp",
    altKey: "home.alt.advisory",
    titleKey: "home.service.advisory",
    descriptionKey: "home.service.advisory_desc",
    tagKey: "home.service.tag.advisory",
    href: "/services",
  },
] as const;

const trustPillars = [
  {
    icon: Shield,
    titleKey: "home.pillar.security",
    textKey: "home.pillar.security_text",
  },
  {
    icon: Globe2,
    titleKey: "home.pillar.global",
    textKey: "home.pillar.global_text",
  },
  {
    icon: Users,
    titleKey: "home.pillar.service",
    textKey: "home.pillar.service_text",
  },
  {
    icon: Award,
    titleKey: "home.pillar.track",
    textKey: "home.pillar.track_text",
  },
] as const;

const journeySteps = [
  {
    step: 1,
    titleKey: "home.how.step1",
    descriptionKey: "home.how.step1_desc",
    image: "/brand/contact.webp",
  },
  {
    step: 2,
    titleKey: "home.how.step2",
    descriptionKey: "home.how.step2_desc",
    image: "/brand/corporate.webp",
  },
  {
    step: 3,
    titleKey: "home.how.step3",
    descriptionKey: "home.how.step3_desc",
    image: "/brand/banking.webp",
  },
  {
    step: 4,
    titleKey: "home.how.step4",
    descriptionKey: "home.how.step4_desc",
    image: "/brand/real-estate.webp",
  },
] as const;

export function HomepageView() {
  const { t } = useI18n();

  return (
    <>
      <HomepageHero />

      <section
        className="border-y border-slate-800 bg-slate-950 text-white"
        aria-label="Platform highlights"
      >
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:gap-x-8 md:grid-cols-4 md:gap-y-0">
            {homepageStats.map((stat, index) => (
              <div
                key={stat.labelKey}
                className={cn(
                  "text-center md:text-left",
                  index < homepageStats.length - 1
                    ? "md:border-r md:border-white/15 md:pr-6 lg:pr-8"
                    : "",
                )}
              >
                <p className="text-xl font-semibold tracking-tight text-white tabular-nums sm:text-2xl lg:text-3xl">
                  {stat.value}
                </p>
                {stat.suffixKey ? (
                  <p className="mt-0.5 text-[10px] font-medium tracking-wider text-slate-400 uppercase sm:text-xs">
                    {t(stat.suffixKey)}
                  </p>
                ) : null}
                <p className="mt-1.5 text-[11px] leading-snug text-slate-300 sm:text-sm">
                  {t(stat.labelKey)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={section.padding} aria-label="What we do">
        <div className={section.container}>
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <p className={section.eyebrow}>{t("home.what.eyebrow")}</p>
              <h2 className={section.heading}>{t("home.what.title")}</h2>
              <p className={section.body}>{t("home.what.body")}</p>
            </div>
            <Link href="/services" className={marketingOutlineBtn("shrink-0")}>
              {t("home.what.view_services")}
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </Link>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:mt-14 lg:grid-cols-4">
            {practiceAreas.map((item) => (
              <Link key={item.titleKey} href={item.href} className={cn(card.base, "flex flex-col")}>
                <div className="relative aspect-[4/3]">
                  <Image
                    src={item.image}
                    alt={t(item.altKey)}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 50vw, 25vw"
                  />
                  <span className="absolute top-3 left-3 rounded-md bg-background/90 px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
                    {t(item.tagKey)}
                  </span>
                </div>
                <div className={card.padding}>
                  <h3 className="text-sm font-semibold sm:text-base">{t(item.titleKey)}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {t(item.descriptionKey)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className={section.padding} aria-label="Why Unique Sky Way">
        <div className={section.container}>
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border/60 shadow-md">
              <Image
                src="/brand/trust.webp"
                alt={t("home.alt.team")}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent" />
              <div className="absolute right-5 bottom-5 left-5 rounded-lg border border-white/15 bg-slate-950/50 px-4 py-3 backdrop-blur-sm">
                <p className="text-sm leading-snug font-medium text-white">
                  &ldquo;{t("home.why.quote")}&rdquo;
                </p>
              </div>
            </div>
            <div>
              <p className={section.eyebrow}>{t("home.why.eyebrow")}</p>
              <h2 className={section.heading}>{t("home.why.title")}</h2>
              <p className={section.body}>{t("home.why.body")}</p>
              <div className="mt-10 grid gap-6 sm:grid-cols-2">
                {trustPillars.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.titleKey} className="flex gap-3.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/50 text-primary">
                        <Icon className="h-4 w-4" aria-hidden />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold">{t(item.titleKey)}</h3>
                        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                          {t(item.textKey)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={cn("bg-muted/30", section.padding)} aria-label="How it works">
        <div className={section.container}>
          <div className="text-center">
            <p className={section.eyebrow}>{t("home.how.eyebrow")}</p>
            <h2 className={section.heading}>{t("home.how.title")}</h2>
            <p className={section.bodyCenter}>{t("home.how.body")}</p>
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:mt-14 lg:grid-cols-4 lg:gap-6">
            {journeySteps.map((step) => (
              <div key={step.step} className="group flex flex-col">
                <div className={cn(card.base, "relative mb-4 aspect-[4/3]")}>
                  <Image
                    src={step.image}
                    alt={t(step.titleKey)}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                  <div className="absolute top-4 left-4 flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground shadow-sm">
                    {step.step}
                  </div>
                </div>
                <h3 className="text-sm font-semibold sm:text-base">{t(step.titleKey)}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {t(step.descriptionKey)}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center lg:mt-14">
            <Link href="/how-it-works" className={marketingPrimaryBtn()}>
              {t("home.how.see_full")}
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      <InvestmentPlansSection />

      <HomepageTestimonials />

      <section
        className={cn("relative overflow-hidden bg-slate-950 text-white", section.padding)}
        aria-label="Get started"
      >
        <div className={section.container}>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-semibold leading-[1.15] tracking-tight text-white sm:text-4xl">
              {t("home.cta.title")}
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-300">
              {t("home.cta.body")}
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/auth/register"
                className={cn(
                  marketingPrimaryBtn("w-full sm:w-auto"),
                  "bg-white text-slate-900 hover:bg-slate-100 hover:text-slate-900",
                )}
              >
                {t("home.cta.create")}
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
              </Link>
              <Link
                href="/about"
                className={cn(
                  marketingOutlineBtn("w-full sm:w-auto"),
                  "border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white",
                )}
              >
                {t("home.cta.learn")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
