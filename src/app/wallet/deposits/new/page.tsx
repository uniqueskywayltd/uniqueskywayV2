import type { Metadata } from "next";

import { DepositJourney } from "@/features/customer/wallet/deposit-journey";
import { DepositSurfaceHero } from "@/features/customer/wallet/deposit-surface-hero";
import { getRequestLanguage } from "@/i18n/request-language";
import { createTranslator } from "@/i18n/translate";

export async function generateMetadata(): Promise<Metadata> {
  const { language } = await getRequestLanguage();
  const t = createTranslator(language);
  return {
    title: `${t("meta.wallet.new_deposit.title")} | Unique Sky Way`,
    robots: { index: false, follow: false },
  };
}

/** WP3 — New deposit journey over certified deposit engine. */
export default function NewDepositPage() {
  return (
    <div className="space-y-8 sm:space-y-9">
      <DepositSurfaceHero
        titleKey="wallet.page.new_deposit_title"
        descriptionKey="wallet.page.new_deposit_desc"
      />
      <DepositJourney />
    </div>
  );
}
