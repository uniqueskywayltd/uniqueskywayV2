import type { Metadata } from "next";
import {
  ArrowUpFromLine,
  BadgeCheck,
  CreditCard,
  Layers,
  LineChart,
  UserRoundPlus,
  Wallet,
} from "lucide-react";

import {
  TrustCtaBand,
  TrustPageHero,
  TrustSection,
} from "@/features/public/components/trust/trust-page";
import { HOW_IT_WORKS_COPY } from "@/features/public/content/trust-pages";
import { buildPageMetadata, webPageJsonLd } from "@/lib/seo/metadata";
import { JsonLdScript } from "@/lib/seo/structured-data";

const HOW_IT_WORKS_DESCRIPTION =
  "See how Unique Sky Way works in clear steps—from creating an account to funding, investing, earning, and withdrawing.";

const STEP_ICONS = [
  UserRoundPlus,
  BadgeCheck,
  CreditCard,
  Layers,
  LineChart,
  Wallet,
  ArrowUpFromLine,
] as const;

export const metadata: Metadata = buildPageMetadata({
  title: "How It Works",
  description: HOW_IT_WORKS_DESCRIPTION,
  path: "/how-it-works",
});

export default function HowItWorksPage() {
  const copy = HOW_IT_WORKS_COPY;

  return (
    <article>
      <JsonLdScript
        data={webPageJsonLd({
          title: "How It Works",
          description: HOW_IT_WORKS_DESCRIPTION,
          path: "/how-it-works",
        })}
      />
      <TrustPageHero
        purpose={copy.purpose}
        eyebrow={copy.hero.eyebrow}
        title={copy.hero.title}
        lead={copy.hero.lead}
        image="/brand/global-markets.webp"
        imageAlt="Investment portfolio"
        align="center"
      />

      <TrustSection title="The journey">
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {copy.steps.map((step, index) => {
            const Icon = STEP_ICONS[index] ?? UserRoundPlus;
            return (
              <li
                key={step.title}
                className="rounded-xl border border-border/80 bg-background p-5 shadow-[var(--elevation-1)]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-foreground">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <p className="mt-4 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Step {index + 1}
                </p>
                <p className="mt-2 text-base font-semibold text-foreground">{step.title}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.detail}</p>
              </li>
            );
          })}
        </ol>
      </TrustSection>

      <TrustSection title={copy.status.title} className="bg-muted/30">
        <p>{copy.status.lead}</p>
        <ul className="mt-6 space-y-4">
          {copy.status.items.map((item) => (
            <li key={item.label} className="border-l border-border pl-4">
              <p className="text-sm font-semibold text-foreground">{item.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.meaning}</p>
            </li>
          ))}
        </ul>
      </TrustSection>

      <TrustSection title={copy.notes.title}>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-border/80 p-5">
            <p className="text-sm font-semibold text-foreground">Funding</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy.notes.funding}</p>
          </div>
          <div className="rounded-xl border border-border/80 p-5">
            <p className="text-sm font-semibold text-foreground">Withdrawals</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy.notes.withdrawal}</p>
          </div>
        </div>
      </TrustSection>

      <TrustCtaBand {...copy.cta} />
    </article>
  );
}
