import type { Metadata } from "next";

import { DashboardView } from "@/features/customer/dashboard/dashboard-view";
import { getRequestLanguage } from "@/i18n/request-language";
import { createTranslator } from "@/i18n/translate";

export async function generateMetadata(): Promise<Metadata> {
  const { language } = await getRequestLanguage();
  const t = createTranslator(language);
  return {
    title: `${t("meta.dashboard.title")} | Unique Sky Way`,
    description: t("meta.dashboard.description"),
    robots: { index: false, follow: false },
  };
}

/**
 * Sprint B5 — Dashboard financial home.
 * Widget composition binds read-only certified customer APIs (`FINANCIAL_DASHBOARD_PRINCIPLES.md`).
 */
export default function DashboardPage() {
  return <DashboardView />;
}
