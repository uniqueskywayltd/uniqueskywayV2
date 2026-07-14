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
  "Contact Unique Sky Way. Send a message through our intake form. Unpublished channels are marked pending—never invented.";

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

      <TrustSection title={copy.channels.title}>
        <ul className="grid gap-4 md:grid-cols-3">
          {copy.channels.items.map((channel) => (
            <li key={channel.label} className="rounded-xl border border-border/80 p-5">
              <p className="text-sm font-semibold text-foreground">{channel.label}</p>
              <p className="mt-2 text-sm text-muted-foreground">{channel.value}</p>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">{channel.note}</p>
              {channel.status === "pending" ? (
                <p className="mt-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Pending
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </TrustSection>

      <TrustSection title={copy.expectations.title} className="bg-muted/30">
        <p>{copy.expectations.hours}</p>
        <p>{copy.expectations.response}</p>
        <p>{copy.expectations.topics}</p>
      </TrustSection>

      <TrustSection title={copy.form.title}>
        <ContactForm />
      </TrustSection>

      <TrustCtaBand {...copy.cta} />
    </article>
  );
}
