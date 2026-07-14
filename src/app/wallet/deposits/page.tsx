import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui";
import { DepositHistory } from "@/features/customer/wallet/deposit-history";
import { DepositSurfaceHero } from "@/features/customer/wallet/deposit-surface-hero";

export const metadata: Metadata = {
  title: "Deposits | Unique Sky Way",
  robots: { index: false, follow: false },
};

/** WP2 — Deposit overview / history over certified deposit engine. */
export default function DepositHistoryPage() {
  return (
    <div className="space-y-8">
      <DepositSurfaceHero
        title="Deposits"
        description="Funding intents from the certified money-movement engine — status and timelines only. No invented balances."
        showNewDeposit
      />
      <DepositHistory />
      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link href="/wallet">Back to wallet</Link>
        </Button>
      </div>
    </div>
  );
}
