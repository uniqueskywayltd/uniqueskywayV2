import type { Metadata } from "next";

import { DepositDetailView } from "@/features/customer/wallet/deposit-detail-view";
import { DepositSurfaceHero } from "@/features/customer/wallet/deposit-surface-hero";

export const metadata: Metadata = {
  title: "Deposit detail | Unique Sky Way",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ depositId: string }>;
}

/** WP2 — Deposit detail presentation over certified timeline. */
export default async function DepositDetailPage({ params }: PageProps) {
  const { depositId } = await params;

  return (
    <div className="space-y-8">
      <DepositSurfaceHero
        title="Deposit"
        description="Status, timeline, and next expected step — read-only from the certified deposit engine."
      />
      <DepositDetailView depositId={depositId} />
    </div>
  );
}
