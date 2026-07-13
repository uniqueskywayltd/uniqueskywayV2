import type { Metadata } from "next";

import { CustomerPageHeader } from "@/features/customer/components/page-header";
import { DepositJourney } from "@/features/customer/wallet/deposit-journey";

export const metadata: Metadata = {
  title: "Add funds | Unique Sky Way",
  robots: { index: false, follow: false },
};

export default function NewDepositPage() {
  return (
    <div className="space-y-6">
      <CustomerPageHeader
        title="Add funds"
        description="How do I add funds safely? Amount → confirm → provider → status. Not instant."
      />
      <DepositJourney />
    </div>
  );
}
