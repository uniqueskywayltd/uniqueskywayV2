import type { Metadata } from "next";

import { DepositHistory } from "@/features/customer/wallet/deposit-history";
import { DepositSurfaceHero } from "@/features/customer/wallet/deposit-surface-hero";
import { WalletBackLink } from "@/features/customer/wallet/wallet-back-link";
import { getRequestLanguage } from "@/i18n/request-language";
import { createTranslator } from "@/i18n/translate";

export async function generateMetadata(): Promise<Metadata> {
  const { language } = await getRequestLanguage();
  const t = createTranslator(language);
  return {
    title: `${t("meta.wallet.deposits.title")} | Unique Sky Way`,
    robots: { index: false, follow: false },
  };
}

/** WP2 — Deposit overview / history over certified deposit engine. */
export default function DepositHistoryPage() {
  return (
    <div className="space-y-8 sm:space-y-9">
      <DepositSurfaceHero
        titleKey="wallet.page.deposits_title"
        descriptionKey="wallet.page.deposits_desc"
        showNewDeposit
      />
      <DepositHistory />
      <div className="flex flex-wrap gap-3">
        <WalletBackLink />
      </div>
    </div>
  );
}
