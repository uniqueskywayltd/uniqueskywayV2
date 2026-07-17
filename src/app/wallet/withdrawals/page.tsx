import type { Metadata } from "next";

import { WithdrawalHistory } from "@/features/customer/wallet/withdrawal-history";
import { WithdrawalSurfaceHero } from "@/features/customer/wallet/withdrawal-surface-hero";
import { WalletBackLink } from "@/features/customer/wallet/wallet-back-link";

export const metadata: Metadata = {
  title: "Withdrawals | Unique Sky Way",
  robots: { index: false, follow: false },
};

/** WP3 — Withdrawal overview / history over certified withdrawal engine. */
export default function WithdrawalHistoryPage() {
  return (
    <div className="space-y-8 sm:space-y-9">
      <WithdrawalSurfaceHero
        titleKey="wallet.page.withdrawals_title"
        descriptionKey="wallet.page.withdrawals_desc"
        showNewWithdrawal
      />
      <WithdrawalHistory />
      <div className="flex flex-wrap gap-3">
        <WalletBackLink />
      </div>
    </div>
  );
}
