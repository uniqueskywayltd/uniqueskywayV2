import type { Metadata } from "next";

import { CustomerPageHeader } from "@/features/customer/components/page-header";
import { WithdrawalDetailView } from "@/features/customer/wallet/withdrawal-detail-view";

export const metadata: Metadata = {
  title: "Withdrawal detail | Unique Sky Way",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ withdrawalId: string }>;
}

export default async function WithdrawalDetailPage({ params }: PageProps) {
  const { withdrawalId } = await params;

  return (
    <div className="space-y-6">
      <CustomerPageHeader
        title="Withdrawal"
        description="Anxiety-reducing detail: status → next step → expectancy → support."
      />
      <WithdrawalDetailView withdrawalId={withdrawalId} />
    </div>
  );
}
