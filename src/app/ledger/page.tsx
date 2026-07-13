import type { Metadata } from "next";

import { CustomerPageHeader } from "@/features/customer/components/page-header";
import { LedgerExplorer } from "@/features/customer/wallet/ledger-explorer";

export const metadata: Metadata = {
  title: "Ledger | Unique Sky Way",
  description: "What exactly happened — ledger-backed financial history.",
  robots: { index: false, follow: false },
};

/** Sprint B3 — ledger read binding over certified postings. */
export default function LedgerPage() {
  return (
    <div className="space-y-6">
      <CustomerPageHeader
        title="Ledger"
        description="What exactly happened? Posted movements from the certified ledger — never recalculated here."
      />
      <LedgerExplorer />
    </div>
  );
}
