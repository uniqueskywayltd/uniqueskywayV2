import type { Metadata } from "next";
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
import { PLANS_COPY } from "@/features/public/content/conversion-pages";
import { buildPageMetadata, webPageJsonLd } from "@/lib/seo/metadata";
import { JsonLdScript } from "@/lib/seo/structured-data";
import { cn } from "@/lib/utils";

const PLANS_DESCRIPTION =
  "From entry-level Silver to premium Master plans — each designed with clear terms, transparent returns, and professional management.";

const FEATURES = [
  {
    icon: BarChart3,
    title: "Real-time tracking",
    text: "Monitor your investments, returns, and portfolio performance from a single dashboard.",
  },
  {
    icon: Shield,
    title: "Secure transactions",
    text: "Every deposit and withdrawal is logged, audited, and protected by enterprise security.",
  },
  {
    icon: Clock,
    title: "Flexible durations",
    text: "Choose from multiple plan durations designed to match your investment timeline.",
  },
  {
    icon: Wallet,
    title: "Easy withdrawals",
    text: "Request withdrawals through your dashboard with full transparency on processing status.",
  },
] as const;

export const metadata: Metadata = buildPageMetadata({
  title: "Investment Plans",
  description: PLANS_DESCRIPTION,
  path: "/plans",
});

export default function PlansPage() {
  const copy = PLANS_COPY;

  return (
    <article>
      <JsonLdScript
        data={webPageJsonLd({
          title: "Investment Plans",
          description: PLANS_DESCRIPTION,
          path: "/plans",
        })}
      />

      <TrustPageHero
        purpose={copy.purpose}
        eyebrow={copy.hero.eyebrow}
        title={copy.hero.title}
        lead={copy.hero.lead}
        image="/brand/investments.webp"
        imageAlt="Investment opportunities"
        align="center"
      />

      <section className={section.padding}>
        <div className={section.container}>
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-2xl">
              <Image
                src="/brand/portfolio.webp"
                alt="Investment portfolio management"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent" />
              <div className="absolute right-6 bottom-6 left-6">
                <p className="text-lg font-medium text-white">Professional portfolio management</p>
                <p className="mt-1 text-sm text-white/70">
                  Transparent terms. Secure operations. Full visibility.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-xl border border-border/60 bg-card/50 p-5"
                >
                  <feature.icon className="mb-3 h-6 w-6 text-primary" aria-hidden />
                  <h3 className="font-medium text-foreground">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <InvestmentPlansSection showCompareStrip={false} />

      <TrustSection title={copy.lifecycle.title}>
        <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {copy.lifecycle.steps.map((step, index) => (
            <li key={step.title} className="min-w-0">
              <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
                Step {index + 1}
              </p>
              <p className="mt-2 text-base font-semibold text-foreground">{step.title}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.detail}</p>
            </li>
          ))}
        </ol>
      </TrustSection>

      <TrustSection title={copy.eligibility.title} className="bg-muted/30">
        <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
          {copy.eligibility.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </TrustSection>

      <TrustSection title={copy.risk.title}>
        <p>{copy.risk.body}</p>
        <p className="mt-3">
          <Link
            href={copy.risk.href}
            className={cn("font-medium text-foreground underline underline-offset-4")}
          >
            {copy.risk.label}
          </Link>
        </p>
      </TrustSection>

      <TrustCtaBand {...copy.cta} />
    </article>
  );
}
