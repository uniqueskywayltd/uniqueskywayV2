import type { Metadata } from "next";
import Link from "next/link";

import {
  TrustCtaBand,
  TrustPageHero,
  TrustSection,
} from "@/features/public/components/trust/trust-page";
import { SECURITY_COPY } from "@/features/public/content/trust-pages";
import { buildPageMetadata, webPageJsonLd } from "@/lib/seo/metadata";
import { JsonLdScript } from "@/lib/seo/structured-data";

const SECURITY_DESCRIPTION =
  "Learn how Unique Sky Way approaches account protection, verification, fund review statuses, privacy, and recovery—without exaggerated claims.";

export const metadata: Metadata = buildPageMetadata({
  title: "Security",
  description: SECURITY_DESCRIPTION,
  path: "/security",
});

export default function SecurityPage() {
  const copy = SECURITY_COPY;

  return (
    <article>
      <JsonLdScript
        data={webPageJsonLd({
          title: "Security",
          description: SECURITY_DESCRIPTION,
          path: "/security",
        })}
      />
      <TrustPageHero
        purpose={copy.purpose}
        eyebrow={copy.hero.eyebrow}
        title={copy.hero.title}
        lead={copy.hero.lead}
        image="/brand/security.webp"
        imageAlt="Platform security"
      />

      <TrustSection title={copy.account.title}>
        <ul className="list-disc space-y-2 pl-5">
          {copy.account.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </TrustSection>

      <TrustSection title={copy.auth.title} className="bg-muted/30">
        <p>{copy.auth.body}</p>
      </TrustSection>

      <TrustSection title={copy.funds.title}>
        <p>{copy.funds.body}</p>
      </TrustSection>

      <TrustSection title={copy.monitoring.title} className="bg-muted/30">
        <ul className="list-disc space-y-2 pl-5">
          {copy.monitoring.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </TrustSection>

      <TrustSection title={copy.privacy.title}>
        <p>{copy.privacy.body}</p>
      </TrustSection>

      <TrustSection title={copy.never.title} className="bg-muted/30">
        <ul className="list-disc space-y-2 pl-5">
          {copy.never.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </TrustSection>

      <TrustSection title={copy.policies.title}>
        <ul className="flex flex-wrap gap-3">
          {copy.policies.links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="inline-flex rounded-md border border-border px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        <p className="pt-2 text-sm">
          Policy pages publish as counsel-approved content becomes available. Until then, we prefer
          omission over invention.
        </p>
      </TrustSection>

      <TrustCtaBand {...copy.cta} />
    </article>
  );
}
