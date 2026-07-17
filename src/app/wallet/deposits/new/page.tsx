import type { Metadata } from "next";

import { DepositJourney } from "@/features/customer/wallet/deposit-journey";
import { DepositSurfaceHero } from "@/features/customer/wallet/deposit-surface-hero";

export const metadata: Metadata = {
  title: "New deposit | Unique Sky Way",
  robots: { index: false, follow: false },
};

/** WP2 — Deposit CTA / journey presentation; engine calls unchanged. */
export default function NewDepositPage() {
  return (
    <div className="space-y-8">
      <DepositSurfaceHero
        titleKey="wallet.page.new_deposit_title"
        descriptionKey="wallet.page.new_deposit_desc"
      />
      <DepositJourney />
    </div>
  );
}
