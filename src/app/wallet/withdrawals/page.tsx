import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui";
import { WithdrawalHistory } from "@/features/customer/wallet/withdrawal-history";
import { WithdrawalSurfaceHero } from "@/features/customer/wallet/withdrawal-surface-hero";

export const metadata: Metadata = {
  title: "Withdrawals | Unique Sky Way",
  robots: { index: false, follow: false },
};

/** WP3 — Withdrawal overview / history over certified withdrawal engine. */
export default function WithdrawalHistoryPage() {
  return (
    <div className="space-y-8">
      <WithdrawalSurfaceHero
        title="Withdrawals"
        description="Every request keeps certified status and next-step guidance so you always know what is happening — without invented ETAs."
        showNewWithdrawal
      />
      <WithdrawalHistory />
      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link href="/wallet">Back to wallet</Link>
        </Button>
      </div>
    </div>
  );
}
