import type { Metadata } from "next";

import { CustomerPageHeader } from "@/features/customer/components/page-header";
import { DepositDetailView } from "@/features/customer/wallet/deposit-detail-view";

export const metadata: Metadata = {
  title: "Deposit detail | Unique Sky Way",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ depositId: string }>;
}

export default async function DepositDetailPage({ params }: PageProps) {
  const { depositId } = await params;

  return (
    <div className="space-y-6">
      <CustomerPageHeader
        title="Deposit"
        description="Status, timeline, and next expected step — read-only from the certified deposit engine."
      />
      <DepositDetailView depositId={depositId} />
    </div>
  );
}
