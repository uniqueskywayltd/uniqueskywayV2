import type { Metadata } from "next";

import { ContactPageView } from "@/features/public/components/conversion/contact-page-view";
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
  return (
    <article>
      <JsonLdScript
        data={webPageJsonLd({
          title: "Contact",
          description: CONTACT_DESCRIPTION,
          path: "/contact",
        })}
      />
      <ContactPageView />
    </article>
  );
}
