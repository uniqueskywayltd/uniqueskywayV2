import type { Metadata } from "next";

import { WithdrawalJourney } from "@/features/customer/wallet/withdrawal-journey";
import { WithdrawalSurfaceHero } from "@/features/customer/wallet/withdrawal-surface-hero";

export const metadata: Metadata = {
  title: "New withdrawal | Unique Sky Way",
  robots: { index: false, follow: false },
};

/** WP3 — Withdrawal CTA / journey presentation; engine calls unchanged. */
export default function NewWithdrawalPage() {
  return (
    <div className="space-y-8">
      <WithdrawalSurfaceHero
        title="New withdrawal"
        description="How do I get my money? Clear status after submit — never clock promises."
      />
      <WithdrawalJourney />
    </div>
  );
}
