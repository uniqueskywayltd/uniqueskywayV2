import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Landmark,
  Lock,
  Scale,
  Shield,
} from "lucide-react";

import { Button } from "@/components/ui";
import { LegacyAboutPractice } from "@/features/public/components/homepage/legacy-about-practice";
import { LegacyHeroCarousel } from "@/features/public/components/homepage/legacy-hero-carousel";
import { LegacyPlansVideos } from "@/features/public/components/homepage/legacy-plans-videos";
import { LegacyProjectsStats } from "@/features/public/components/homepage/legacy-projects-stats";
import { HomeSection, SectionHeading } from "@/features/public/components/homepage/section";
import { HOMEPAGE_COPY } from "@/features/public/content/homepage";
import { cn } from "@/lib/utils";

const trustIcons = [BadgeCheck, Scale, Landmark, Shield] as const;

export function HomepageView() {
  const copy = HOMEPAGE_COPY;

  return (
    <>
      <LegacyHeroCarousel />
      <LegacyAboutPractice />
      <LegacyProjectsStats />
      <LegacyPlansVideos />

      {/* Purpose: remove initial skepticism. */}
      <HomeSection id="trust" purpose={copy.trustBar.purpose} tone="muted">
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {copy.trustBar.items.map((item, index) => {
            const Icon = trustIcons[index] ?? BadgeCheck;
            return (
              <li key={item.title}>
                <Link
                  href={item.href}
                  className="group block h-full rounded-xl border border-border/80 bg-background p-5 shadow-[var(--elevation-1)] transition-colors hover:border-foreground/20"
                >
                  <Icon className="size-5 text-foreground" aria-hidden="true" strokeWidth={1.75} />
                  <p className="mt-4 text-sm font-semibold text-foreground">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      </HomeSection>

      {/* Purpose: explain why the company exists and why it is different. */}
      <HomeSection id="why" purpose={copy.why.purpose}>
        <SectionHeading title={copy.why.title} lead={copy.why.lead} />
        <ul className="mt-12 grid gap-8 md:grid-cols-3">
          {copy.why.points.map((point) => (
            <li key={point.title} className="border-t border-border pt-6">
              <h3 className="text-lg font-semibold text-foreground">{point.title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{point.description}</p>
            </li>
          ))}
        </ul>
      </HomeSection>

      {/* Purpose: show how simple the process is. */}
      <HomeSection id="journey" purpose={copy.journey.purpose} tone="muted">
        <SectionHeading title={copy.journey.title} lead={copy.journey.lead} />
        <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {copy.journey.steps.map((step, index) => (
            <li
              key={step.label}
              className="rounded-xl border border-border/80 bg-background p-4 shadow-[var(--elevation-1)]"
            >
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Step {index + 1}
              </p>
              <p className="mt-3 text-base font-semibold text-foreground">{step.label}</p>
              <p className="mt-2 text-sm text-muted-foreground">{step.detail}</p>
            </li>
          ))}
        </ol>
        <div className="mt-10 flex justify-center">
          <Button asChild variant="outline">
            <Link href={copy.journey.cta.href}>
              {copy.journey.cta.label}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </HomeSection>

      {/* Purpose: introduce investment opportunities without overwhelming details. */}
      <HomeSection id="plans" purpose={copy.plans.purpose}>
        <SectionHeading title={copy.plans.title} lead={copy.plans.lead} />
        <ul className="mt-12 grid gap-4 md:grid-cols-3">
          {copy.plans.placeholders.map((plan, index) => (
            <li
              key={`${plan.name}-${index}`}
              className="rounded-xl border border-dashed border-border bg-muted/20 p-6"
            >
              <p className="text-sm font-semibold text-foreground">{plan.name}</p>
              <p className="mt-2 text-sm text-muted-foreground">{plan.detail}</p>
              <p className="mt-6 text-xs text-muted-foreground">Awaiting certified catalog</p>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {copy.plans.emptyTitle}. {copy.plans.emptyDescription}
        </p>
        <p className="mt-3 text-center text-sm text-muted-foreground">
          {copy.plans.footnote}{" "}
          <Link href={copy.plans.riskHref} className="underline underline-offset-4">
            Risk Disclosure
          </Link>
          .
        </p>
        <div className="mt-8 flex justify-center">
          <Button asChild variant="outline">
            <Link href={copy.plans.cta.href}>{copy.plans.cta.label}</Link>
          </Button>
        </div>
      </HomeSection>

      {/* Purpose: answer “Is my money safe?” */}
      <HomeSection id="security" purpose={copy.security.purpose} tone="muted">
        <SectionHeading title={copy.security.title} lead={copy.security.lead} />
        <ul className="mt-12 grid gap-6 md:grid-cols-2">
          {copy.security.pillars.map((pillar) => (
            <li key={pillar.title} className="flex gap-4 rounded-xl border border-border/80 bg-background p-5">
              <Lock className="mt-0.5 size-5 shrink-0 text-foreground" aria-hidden="true" strokeWidth={1.75} />
              <div>
                <h3 className="text-base font-semibold text-foreground">{pillar.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{pillar.description}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-10 flex justify-center">
          <Button asChild>
            <Link href={copy.security.cta.href}>{copy.security.cta.label}</Link>
          </Button>
        </div>
      </HomeSection>

      {/* Purpose: build long-term credibility. */}
      <HomeSection id="story" purpose={copy.story.purpose}>
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <h2 className="font-[family-name:var(--font-instrument-serif)] text-3xl tracking-normal text-foreground sm:text-4xl">
              {copy.story.title}
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              {copy.story.lead}
            </p>
            <Button asChild className="mt-8" variant="outline">
              <Link href={copy.story.cta.href}>{copy.story.cta.label}</Link>
            </Button>
          </div>
          <ul className="space-y-6">
            {copy.story.values.map((value) => (
              <li key={value.title} className="border-l border-border pl-4">
                <p className="text-sm font-semibold text-foreground">{value.title}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{value.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </HomeSection>

      {/* Purpose: resolve the most common objections. */}
      <HomeSection id="faq" purpose={copy.faq.purpose} tone="muted">
        <SectionHeading title={copy.faq.title} />
        <div className="mx-auto mt-10 max-w-3xl space-y-4">
          {copy.faq.items.map((item) => (
            <details
              key={item.question}
              className="group rounded-xl border border-border/80 bg-background px-5 py-4"
            >
              <summary className="cursor-pointer list-none text-left text-sm font-semibold text-foreground marker:content-none [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-4">
                  {item.question}
                  <BookOpen
                    className={cn(
                      "size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-12",
                    )}
                    aria-hidden="true"
                  />
                </span>
              </summary>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.answer}</p>
            </details>
          ))}
        </div>
        <div className="mt-8 flex justify-center">
          <Button asChild variant="outline">
            <Link href={copy.faq.cta.href}>{copy.faq.cta.label}</Link>
          </Button>
        </div>
      </HomeSection>

      {/* Purpose: encourage registration with confidence. */}
      <HomeSection id="get-started" purpose={copy.finalCta.purpose} tone="ink">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-[family-name:var(--font-instrument-serif)] text-3xl tracking-normal sm:text-4xl">
            {copy.finalCta.title}
          </h2>
          <p className="mt-4 text-base leading-7 text-[oklch(0.9_0.01_250)] sm:text-lg">
            {copy.finalCta.support}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-[oklch(0.985_0_0)] text-[oklch(0.18_0.02_252)] hover:bg-[oklch(0.96_0_0)]">
              <Link href={copy.finalCta.primaryCta.href}>{copy.finalCta.primaryCta.label}</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-[oklch(0.85_0.01_250)] bg-transparent text-[oklch(0.985_0_0)] hover:bg-[oklch(0.22_0.02_252)]"
            >
              <Link href={copy.finalCta.secondaryCta.href}>{copy.finalCta.secondaryCta.label}</Link>
            </Button>
          </div>
        </div>
      </HomeSection>
    </>
  );
}
