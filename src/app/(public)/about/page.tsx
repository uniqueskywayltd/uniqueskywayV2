import type { Metadata } from "next";
import Link from "next/link";

import {
  TrustCtaBand,
  TrustPageHero,
  TrustSection,
} from "@/features/public/components/trust/trust-page";
import { ABOUT_COPY } from "@/features/public/content/trust-pages";
import { buildPageMetadata, webPageJsonLd } from "@/lib/seo/metadata";
import { JsonLdScript } from "@/lib/seo/structured-data";

const ABOUT_DESCRIPTION =
  "Learn who Unique Sky Way is, why we exist, and the philosophy behind our calm, transparent investment experience.";

export const metadata: Metadata = buildPageMetadata({
  title: "About",
  description: ABOUT_DESCRIPTION,
  path: "/about",
});

export default function AboutPage() {
  const copy = ABOUT_COPY;

  return (
    <article>
      <JsonLdScript
        data={webPageJsonLd({
          title: "About",
          description: ABOUT_DESCRIPTION,
          path: "/about",
        })}
      />
      <TrustPageHero
        purpose={copy.purpose}
        eyebrow={copy.hero.eyebrow}
        title={copy.hero.title}
        lead={copy.hero.lead}
      />

      <TrustSection title={copy.who.title}>
        <p>{copy.who.body}</p>
      </TrustSection>

      <TrustSection title={copy.why.title} className="bg-muted/30">
        <p>{copy.why.body}</p>
      </TrustSection>

      <TrustSection title={copy.philosophy.title}>
        <ul className="grid gap-6 md:grid-cols-2">
          {copy.philosophy.points.map((point) => (
            <li key={point.title} className="rounded-xl border border-border/80 bg-background p-5">
              <p className="text-base font-semibold text-foreground">{point.title}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{point.body}</p>
            </li>
          ))}
        </ul>
      </TrustSection>

      <TrustSection title={copy.commitment.title} className="bg-muted/30">
        <p>{copy.commitment.body}</p>
      </TrustSection>

      <TrustSection title={copy.responsibility.title}>
        <p>{copy.responsibility.body}</p>
      </TrustSection>

      <TrustSection title={copy.timeline.title} className="bg-muted/30">
        <ul className="list-disc space-y-2 pl-5">
          {copy.timeline.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="pt-2">
          Prefer process over mythology. Read{" "}
          <Link href="/security" className="underline underline-offset-4">
            Security
          </Link>{" "}
          for how we protect accounts and funds.
        </p>
      </TrustSection>

      <TrustCtaBand {...copy.cta} />
    </article>
  );
}
