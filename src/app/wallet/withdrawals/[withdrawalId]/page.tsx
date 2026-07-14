import type { Metadata } from "next";

import { WithdrawalDetailView } from "@/features/customer/wallet/withdrawal-detail-view";
import { WithdrawalSurfaceHero } from "@/features/customer/wallet/withdrawal-surface-hero";

export const metadata: Metadata = {
  title: "Withdrawal detail | Unique Sky Way",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ withdrawalId: string }>;
}

/** WP3 — Withdrawal detail presentation over certified timeline. */
export default async function WithdrawalDetailPage({ params }: PageProps) {
  const { withdrawalId } = await params;

  return (
    <div className="space-y-8">
      <WithdrawalSurfaceHero
        title="Withdrawal"
        description="What is happening, what happens next, and whether you need to do anything — from certified engine status only."
      />
      <WithdrawalDetailView withdrawalId={withdrawalId} />
    </div>
  );
}
