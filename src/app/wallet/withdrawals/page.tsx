import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui";
import { CustomerPageHeader } from "@/features/customer/components/page-header";
import { WithdrawalHistory } from "@/features/customer/wallet/withdrawal-history";

export const metadata: Metadata = {
  title: "Withdrawal history | Unique Sky Way",
  robots: { index: false, follow: false },
};

export default function WithdrawalHistoryPage() {
  return (
    <div className="space-y-6">
      <CustomerPageHeader
        title="Withdrawal history"
        description="Every request keeps status, next step, expectancy, and a support path."
      />
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/wallet/withdrawals/new">Withdraw</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/wallet">Back to wallet</Link>
        </Button>
      </div>
      <WithdrawalHistory />
    </div>
  );
}
