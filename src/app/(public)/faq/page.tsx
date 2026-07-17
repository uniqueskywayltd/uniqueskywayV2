import type { Metadata } from "next";

import { FaqExplorer } from "@/features/public/components/conversion/faq-explorer";
import {
  LegalBackToTop,
  LegalHelpSection,
  LegalScrollProgress,
} from "@/features/public/components/legal/legal-document-layout";
import { LegalPremiumHero } from "@/features/public/components/legal/legal-page";
import { estimateFaqReadingMinutes } from "@/features/public/components/legal/legal-utils";
import { FAQ_COPY } from "@/features/public/content/conversion-pages";
import { buildPageMetadata, faqPageJsonLd, webPageJsonLd } from "@/lib/seo/metadata";
import { JsonLdScript } from "@/lib/seo/structured-data";

const FAQ_DESCRIPTION =
  "Answers about getting started, investments, deposits, withdrawals, security, verification, accounts, and support at Unique Sky Way.";

const FAQ_LAST_UPDATED = "16 July 2026";

export const metadata: Metadata = buildPageMetadata({
  title: "FAQ",
  description: FAQ_DESCRIPTION,
  path: "/faq",
});

export default function FaqPage() {
  const copy = FAQ_COPY;
  const readingMinutes = estimateFaqReadingMinutes(copy.items);

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

      <LegalScrollProgress />
      <LegalPremiumHero
        purpose={copy.purpose}
        eyebrow={copy.hero.eyebrow}
        title={copy.hero.title}
        lead={copy.hero.lead}
        lastUpdated={FAQ_LAST_UPDATED}
        readingMinutes={readingMinutes}
      />

      <FaqExplorer />

      <div className="pb-12 sm:pb-16">
        <LegalHelpSection className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8" />
      </div>

      <LegalBackToTop />
    </article>
  );
}
