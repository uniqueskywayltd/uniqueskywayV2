import type { Metadata } from "next";

import { WalletOverview } from "@/features/customer/wallet/wallet-overview";
import { getRequestLanguage } from "@/i18n/request-language";
import { createTranslator } from "@/i18n/translate";

export async function generateMetadata(): Promise<Metadata> {
  const { language } = await getRequestLanguage();
  const t = createTranslator(language);
  return {
    title: `${t("meta.wallet.title")} | Unique Sky Way`,
    description: t("meta.wallet.description"),
    robots: { index: false, follow: false },
  };
}

/** WP1–WP5 — Wallet shell certified: operations center over certified reads. */
export default function WalletPage() {
  return <WalletOverview />;
}
