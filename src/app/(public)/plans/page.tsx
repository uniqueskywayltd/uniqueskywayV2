import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui";
import {
  TrustCtaBand,
  TrustPageHero,
  TrustSection,
} from "@/features/public/components/trust/trust-page";
import { PLANS_COPY } from "@/features/public/content/conversion-pages";
import { buildPageMetadata, webPageJsonLd } from "@/lib/seo/metadata";
import { JsonLdScript } from "@/lib/seo/structured-data";

const PLANS_DESCRIPTION =
  "Compare Unique Sky Way investment plans. Terms come from the certified catalog when published—never invented returns.";

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

      <TrustSection title={copy.howTermsWork.title}>
        <p>{copy.howTermsWork.body}</p>
      </TrustSection>

      <TrustSection title={copy.catalog.title} className="bg-muted/30">
        <p className="text-sm font-semibold text-foreground">{copy.catalog.emptyTitle}</p>
        <p>{copy.catalog.emptyDescription}</p>
        <ul className="mt-8 grid gap-4 md:grid-cols-3">
          {copy.catalog.placeholders.map((plan, index) => (
            <li
              key={`${plan.name}-${index}`}
              className="flex flex-col rounded-xl border border-border/80 bg-background p-5 shadow-[var(--elevation-1)]"
            >
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {plan.status}
              </p>
              <p className="mt-3 text-lg font-semibold text-foreground">{plan.name}</p>
              <dl className="mt-4 space-y-3 text-sm text-muted-foreground">
                <div>
                  <dt className="font-medium text-foreground">Duration</dt>
                  <dd className="mt-1">{plan.duration}</dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">Eligibility</dt>
                  <dd className="mt-1">{plan.eligibility}</dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">Earnings</dt>
                  <dd className="mt-1">{plan.earnings}</dd>
                </div>
              </dl>
              <div className="mt-6 grow" />
              <Button asChild className="w-full">
                <Link href={`/auth/register?intent=plan`}>Get started</Link>
              </Button>
            </li>
          ))}
        </ul>
      </TrustSection>

      <TrustSection title={copy.lifecycle.title}>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {copy.lifecycle.steps.map((step, index) => (
            <li key={step.title} className="rounded-xl border border-border/80 p-5">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {index + 1}
              </p>
              <p className="mt-2 text-base font-semibold text-foreground">{step.title}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.detail}</p>
            </li>
          ))}
        </ol>
      </TrustSection>

      <TrustSection title={copy.eligibility.title} className="bg-muted/30">
        <ul className="list-disc space-y-2 pl-5">
          {copy.eligibility.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </TrustSection>

      <TrustSection title={copy.risk.title}>
        <p>{copy.risk.body}</p>
        <p>
          <Link href={copy.risk.href} className="underline underline-offset-4">
            {copy.risk.label}
          </Link>
        </p>
      </TrustSection>

      <TrustCtaBand {...copy.cta} />
    </article>
  );
}
