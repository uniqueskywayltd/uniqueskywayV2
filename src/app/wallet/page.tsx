import type { Metadata } from "next";

import { CustomerPageHeader } from "@/features/customer/components/page-header";
import { WalletOverview } from "@/features/customer/wallet/wallet-overview";

export const metadata: Metadata = {
  title: "Wallet | Unique Sky Way",
  description: "How do I safely move money? Operational balances, deposits, and withdrawals.",
  robots: { index: false, follow: false },
};

/** Sprint B3 — Wallet experience over frozen engines. */
export default function WalletPage() {
  return (
    <div>
      <CustomerPageHeader
        title="Wallet"
        description="How do I safely move money? This is your operational balance — not a bank lookalike or an investment list."
      />
      <WalletOverview />
    </div>
  );
}
