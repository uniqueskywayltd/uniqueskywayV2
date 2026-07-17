import type { Metadata } from "next";

import {
  LegalCounselBanner,
  LegalPremiumHero,
  LegalSectionsBody,
} from "@/features/public/components/legal/legal-page";
import {
  LegalDocumentLayout,
  buildTocFromSections,
} from "@/features/public/components/legal/legal-document-layout";
import { estimateReadingMinutes } from "@/features/public/components/legal/legal-utils";
import { LEGAL_PAGES, type LegalPageKey } from "@/features/public/content/legal-pages";
import { translate } from "@/i18n";
import { getRequestLanguage } from "@/i18n/request-language";
import { buildPageMetadata, webPageJsonLd } from "@/lib/seo/metadata";
import { JsonLdScript } from "@/lib/seo/structured-data";

const LEGAL_LAST_UPDATED = "16 July 2026";

export function buildLegalMetadata(key: LegalPageKey): Metadata {
  const page = LEGAL_PAGES[key];
  return buildPageMetadata({
    title: page.title,
    description: page.description,
    path: page.path,
  });
}

export async function LegalDocumentPage({
  pageKey,
  numberedSections = false,
}: {
  pageKey: LegalPageKey;
  numberedSections?: boolean;
}) {
  const { language } = await getRequestLanguage();
  const page = LEGAL_PAGES[pageKey];
  const readingMinutes = estimateReadingMinutes(page.sections);
  const tocItems = buildTocFromSections(page.sections);
  const documentPageKey = pageKey === "privacy" || pageKey === "terms" ? pageKey : undefined;

  return (
    <article>
      <JsonLdScript
        data={webPageJsonLd({
          title: page.title,
          description: page.description,
          path: page.path,
        })}
      />
      <LegalCounselBanner />
      <LegalPremiumHero
        purpose={page.purpose}
        eyebrow={translate(language, "legal.eyebrow")}
        title={page.title}
        lead={page.lead}
        lastUpdated={LEGAL_LAST_UPDATED}
        readingMinutes={readingMinutes}
      />
      <LegalDocumentLayout tocItems={tocItems}>
        <LegalSectionsBody
          sections={page.sections}
          numbered={numberedSections}
          {...(documentPageKey ? { pageKey: documentPageKey } : {})}
        />
      </LegalDocumentLayout>
    </article>
  );
}
