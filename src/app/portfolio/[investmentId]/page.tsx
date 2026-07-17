import type { Metadata } from "next";

import { InvestmentDetailView } from "@/features/customer/portfolio/investment-detail-view";
import { getRequestLanguage } from "@/i18n/request-language";
import { createTranslator } from "@/i18n/translate";

type PageProps = {
  params: Promise<{ investmentId: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const { language } = await getRequestLanguage();
  const t = createTranslator(language);
  return {
    title: `${t("meta.portfolio.detail.title")} | Unique Sky Way`,
    description: t("meta.portfolio.detail.description"),
    robots: { index: false, follow: false },
  };
}

/** PF3 — Investment passport over certified investment detail. */
export default async function InvestmentDetailPage({ params }: PageProps) {
  const { investmentId } = await params;
  return <InvestmentDetailView investmentId={investmentId} />;
}
