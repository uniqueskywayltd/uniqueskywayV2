import type { Metadata } from "next";

import { ContactForm } from "@/features/public/components/conversion/contact-form";
import {
  TrustCtaBand,
  TrustPageHero,
  TrustSection,
} from "@/features/public/components/trust/trust-page";
import { CONTACT_COPY } from "@/features/public/content/conversion-pages";
import { buildPageMetadata, webPageJsonLd } from "@/lib/seo/metadata";
import { JsonLdScript } from "@/lib/seo/structured-data";

const CONTACT_DESCRIPTION =
  "Contact Unique Sky Way. Send a message through our intake form — we respond calmly and clearly.";

export const metadata: Metadata = buildPageMetadata({
  title: "Contact",
  description: CONTACT_DESCRIPTION,
  path: "/contact",
});

export default function ContactPage() {
  const copy = CONTACT_COPY;

  return (
    <article>
      <JsonLdScript
        data={webPageJsonLd({
          title: "Contact",
          description: CONTACT_DESCRIPTION,
          path: "/contact",
        })}
      />

      <TrustPageHero
        purpose={copy.purpose}
        eyebrow={copy.hero.eyebrow}
        title={copy.hero.title}
        lead={copy.hero.lead}
        image="/brand/contact.webp"
        imageAlt="Contact Unique Sky Way"
        align="center"
      />

      <TrustSection title={copy.form.title}>
        <ContactForm />
      </TrustSection>

      <TrustSection title={copy.expectations.title} className="bg-muted/30">
        <p className="text-muted-foreground">{copy.expectations.hours}</p>
        <p className="text-muted-foreground">{copy.expectations.response}</p>
        <p className="text-muted-foreground">{copy.expectations.topics}</p>
      </TrustSection>

      <TrustCtaBand {...copy.cta} />
    </article>
  );
}
