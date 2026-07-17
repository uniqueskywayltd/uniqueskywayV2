import type { Metadata } from "next";

import { WithdrawalJourney } from "@/features/customer/wallet/withdrawal-journey";
import { WithdrawalSurfaceHero } from "@/features/customer/wallet/withdrawal-surface-hero";
import { getRequestLanguage } from "@/i18n/request-language";
import { createTranslator } from "@/i18n/translate";

export async function generateMetadata(): Promise<Metadata> {
  const { language } = await getRequestLanguage();
  const t = createTranslator(language);
  return {
    title: `${t("meta.wallet.new_withdrawal.title")} | Unique Sky Way`,
    robots: { index: false, follow: false },
  };
}

/** WP3 — Withdrawal CTA / journey presentation; engine calls unchanged. */
export default function NewWithdrawalPage() {
  return (
    <div className="space-y-8">
      <WithdrawalSurfaceHero
        titleKey="wallet.page.new_withdrawal_title"
        descriptionKey="wallet.page.new_withdrawal_desc"
      />
      <WithdrawalJourney />
    </div>
  );
}
