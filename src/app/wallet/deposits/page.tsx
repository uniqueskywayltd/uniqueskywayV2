import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui";
import { CustomerPageHeader } from "@/features/customer/components/page-header";
import { DepositHistory } from "@/features/customer/wallet/deposit-history";

export const metadata: Metadata = {
  title: "Funding history | Unique Sky Way",
  robots: { index: false, follow: false },
};

export default function DepositHistoryPage() {
  return (
    <div className="space-y-6">
      <CustomerPageHeader
        title="Funding history"
        description="Deposits from the certified money-movement engine — status and timelines, no invented balances."
      />
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/wallet/deposits/new">Add funds</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/wallet">Back to wallet</Link>
        </Button>
      </div>
      <DepositHistory />
    </div>
  );
}
