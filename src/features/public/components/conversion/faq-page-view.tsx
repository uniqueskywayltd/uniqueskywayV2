"use client";

import { FaqExplorer } from "@/features/public/components/conversion/faq-explorer";
import {
  LegalBackToTop,
  LegalHelpSection,
  LegalScrollProgress,
} from "@/features/public/components/legal/legal-document-layout";
import { LegalPremiumHero } from "@/features/public/components/legal/legal-page";
import { estimateFaqReadingMinutes } from "@/features/public/components/legal/legal-utils";
import { getFaqItems } from "@/features/public/content/i18n-public-content";
import { useI18n } from "@/features/i18n/i18n-provider";

const FAQ_LAST_UPDATED = "16 July 2026";

export function FaqPageView() {
  const { t } = useI18n();
  const items = getFaqItems(t);
  const readingMinutes = estimateFaqReadingMinutes(items);

  return (
    <>
      <LegalScrollProgress />
      <LegalPremiumHero
        purpose={t("faq.purpose")}
        eyebrow={t("faq.hero.eyebrow")}
        title={t("faq.hero.title")}
        lead={t("faq.hero.lead")}
        lastUpdated={FAQ_LAST_UPDATED}
        readingMinutes={readingMinutes}
      />

      <FaqExplorer />

      <div className="pb-12 sm:pb-16">
        <LegalHelpSection className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8" />
      </div>

      <LegalBackToTop />
    </>
  );
}
