import type { Metadata } from "next";

import { WithdrawalDetailView } from "@/features/customer/wallet/withdrawal-detail-view";
import { WithdrawalSurfaceHero } from "@/features/customer/wallet/withdrawal-surface-hero";
import { getRequestLanguage } from "@/i18n/request-language";
import { createTranslator } from "@/i18n/translate";

export async function generateMetadata(): Promise<Metadata> {
  const { language } = await getRequestLanguage();
  const t = createTranslator(language);
  return {
    title: `${t("meta.wallet.withdrawal_detail.title")} | Unique Sky Way`,
    robots: { index: false, follow: false },
  };
}

interface PageProps {
  params: Promise<{ withdrawalId: string }>;
}

/** WP3 — Withdrawal detail presentation over certified timeline. */
export default async function WithdrawalDetailPage({ params }: PageProps) {
  const { withdrawalId } = await params;

  return (
    <div className="space-y-8">
      <WithdrawalSurfaceHero
        titleKey="wallet.page.withdrawal_detail_title"
        descriptionKey="wallet.page.withdrawal_detail_desc"
      />
      <WithdrawalDetailView withdrawalId={withdrawalId} />
    </div>
  );
}
