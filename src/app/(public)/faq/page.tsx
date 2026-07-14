import type { Metadata } from "next";

import { FaqExplorer } from "@/features/public/components/conversion/faq-explorer";
import {
  TrustCtaBand,
  TrustPageHero,
} from "@/features/public/components/trust/trust-page";
import { FAQ_COPY } from "@/features/public/content/conversion-pages";
import { buildPageMetadata, faqPageJsonLd, webPageJsonLd } from "@/lib/seo/metadata";
import { JsonLdScript } from "@/lib/seo/structured-data";

const FAQ_DESCRIPTION =
  "Answers about getting started, investments, deposits, withdrawals, security, verification, accounts, and support at Unique Sky Way.";

export const metadata: Metadata = buildPageMetadata({
  title: "FAQ",
  description: FAQ_DESCRIPTION,
  path: "/faq",
});

export default function FaqPage() {
  const copy = FAQ_COPY;

  return (
    <article>
      <JsonLdScript
        data={webPageJsonLd({
          title: "FAQ",
          description: FAQ_DESCRIPTION,
          path: "/faq",
        })}
      />
      <JsonLdScript
        data={faqPageJsonLd(
          copy.items.map((item) => ({
            question: item.question,
            answer: item.answer,
          })),
        )}
      />

      <TrustPageHero
        purpose={copy.purpose}
        eyebrow={copy.hero.eyebrow}
        title={copy.hero.title}
        lead={copy.hero.lead}
        image="/brand/trust.webp"
        imageAlt="Support and guidance"
        align="center"
      />

      <FaqExplorer />

      <TrustCtaBand {...copy.cta} />
    </article>
  );
}
