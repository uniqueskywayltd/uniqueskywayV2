import type { Metadata } from "next";

import {
  LegalCounselBanner,
  LegalPageBody,
  LegalPageHero,
} from "@/features/public/components/legal/legal-page";
import { LEGAL_PAGES, type LegalPageKey } from "@/features/public/content/legal-pages";
import { buildPageMetadata, webPageJsonLd } from "@/lib/seo/metadata";
import { JsonLdScript } from "@/lib/seo/structured-data";

export function buildLegalMetadata(key: LegalPageKey): Metadata {
  const page = LEGAL_PAGES[key];
  return buildPageMetadata({
    title: page.title,
    description: page.description,
    path: page.path,
  });
}

export function LegalDocumentPage({ pageKey }: { pageKey: LegalPageKey }) {
  const page = LEGAL_PAGES[pageKey];

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
      <LegalPageHero
        purpose={page.purpose}
        eyebrow="Legal"
        title={page.title}
        lead={page.lead}
      />
      <LegalPageBody sections={page.sections} />
    </article>
  );
}
