import type { Metadata } from "next";

import { WalletOverview } from "@/features/customer/wallet/wallet-overview";

export const metadata: Metadata = {
  title: "Wallet | Unique Sky Way",
  description: "How do I safely move money? Operational balances, deposits, and withdrawals.",
  robots: { index: false, follow: false },
};

/** WP1 — Wallet shell over certified wallet read model. */
export default function WalletPage() {
  return <WalletOverview />;
}
