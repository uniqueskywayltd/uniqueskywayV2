import type { Metadata } from "next";

import { CustomerPageHeader } from "@/features/customer/components/page-header";
import { PortfolioExplorer } from "@/features/customer/portfolio/portfolio-explorer";

export const metadata: Metadata = {
  title: "Portfolio | Unique Sky Way",
  description: "Where your money is invested — read-only portfolio experience.",
  robots: { index: false, follow: false },
};

/** Sprint B2 — Portfolio experience only (read-only). */
export default function PortfolioPage() {
  return (
    <div>
      <CustomerPageHeader
        title="Portfolio"
        description="Where is my money? Certified investments only — no deposits or withdrawals here."
      />
      <PortfolioExplorer />
    </div>
  );
}
