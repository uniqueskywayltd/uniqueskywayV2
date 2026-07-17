import type { Metadata } from "next";

import { PortfolioOverview } from "@/features/customer/portfolio/portfolio-overview";
import { getRequestLanguage } from "@/i18n/request-language";
import { createTranslator } from "@/i18n/translate";

export async function generateMetadata(): Promise<Metadata> {
  const { language } = await getRequestLanguage();
  const t = createTranslator(language);
  return {
    title: `${t("meta.portfolio.title")} | Unique Sky Way`,
    description: t("meta.portfolio.description"),
    robots: { index: false, follow: false },
  };
}

/** PF1–PF5 — Portfolio certified: explains investments over certified reads. */
export default function PortfolioPage() {
  return <PortfolioOverview />;
}
