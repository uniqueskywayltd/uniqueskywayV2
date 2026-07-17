import type { Metadata } from "next";

import { CustomerPageHeader } from "@/features/customer/components/page-header";
import { LedgerExplorer } from "@/features/customer/wallet/ledger-explorer";
import { getRequestLanguage } from "@/i18n/request-language";
import { createTranslator } from "@/i18n/translate";

export async function generateMetadata(): Promise<Metadata> {
  const { language } = await getRequestLanguage();
  const t = createTranslator(language);
  return {
    title: `${t("meta.ledger.title")} | Unique Sky Way`,
    description: t("meta.ledger.description"),
    robots: { index: false, follow: false },
  };
}

/** Sprint B3 — ledger read binding over certified postings. */
export default async function LedgerPage() {
  const { language } = await getRequestLanguage();
  const t = createTranslator(language);

  return (
    <div className="space-y-6">
      <CustomerPageHeader
        title={t("ledger.page.title")}
        description={t("ledger.page.description")}
      />
      <LedgerExplorer />
    </div>
  );
}
