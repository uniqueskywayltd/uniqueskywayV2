import type { Metadata } from "next";

import { FaqPageView } from "@/features/public/components/conversion/faq-page-view";
import { buildPageMetadata, webPageJsonLd } from "@/lib/seo/metadata";
import { JsonLdScript } from "@/lib/seo/structured-data";

const FAQ_DESCRIPTION =
  "Answers about getting started, investments, deposits, withdrawals, security, verification, accounts, and support at Unique Sky Way.";

export const metadata: Metadata = buildPageMetadata({
  title: "FAQ",
  description: FAQ_DESCRIPTION,
  path: "/faq",
});

export default function FaqPage() {
  return (
    <article>
      <JsonLdScript
        data={webPageJsonLd({
          title: "FAQ",
          description: FAQ_DESCRIPTION,
          path: "/faq",
        })}
      />
      <FaqPageView />
    </article>
  );
}
