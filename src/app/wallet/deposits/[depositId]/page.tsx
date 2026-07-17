import type { Metadata } from "next";

import { DepositDetailView } from "@/features/customer/wallet/deposit-detail-view";
import { DepositSurfaceHero } from "@/features/customer/wallet/deposit-surface-hero";
import { getRequestLanguage } from "@/i18n/request-language";
import { createTranslator } from "@/i18n/translate";

export async function generateMetadata(): Promise<Metadata> {
  const { language } = await getRequestLanguage();
  const t = createTranslator(language);
  return {
    title: `${t("meta.wallet.deposit_detail.title")} | Unique Sky Way`,
    robots: { index: false, follow: false },
  };
}

interface PageProps {
  params: Promise<{ depositId: string }>;
}

/** WP2 — Deposit detail presentation over certified timeline. */
export default async function DepositDetailPage({ params }: PageProps) {
  const { depositId } = await params;

  return (
    <div className="space-y-8">
      <DepositSurfaceHero
        titleKey="wallet.page.deposit_detail_title"
        descriptionKey="wallet.page.deposit_detail_desc"
      />
      <DepositDetailView depositId={depositId} />
    </div>
  );
}
