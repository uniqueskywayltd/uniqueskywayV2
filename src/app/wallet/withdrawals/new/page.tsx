import type { Metadata } from "next";

import { CustomerPageHeader } from "@/features/customer/components/page-header";
import { WithdrawalJourney } from "@/features/customer/wallet/withdrawal-journey";

export const metadata: Metadata = {
  title: "Withdraw | Unique Sky Way",
  robots: { index: false, follow: false },
};

export default function NewWithdrawalPage() {
  return (
    <div className="space-y-6">
      <CustomerPageHeader
        title="Withdraw"
        description="How do I get my money? Clear status, next step, expectancy, and support — never clock promises."
      />
      <WithdrawalJourney />
    </div>
  );
}
