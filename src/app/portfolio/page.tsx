import type { Metadata } from "next";

import { PortfolioOverview } from "@/features/customer/portfolio/portfolio-overview";

export const metadata: Metadata = {
  title: "Investments | Unique Sky Way",
  description: "How are my investments performing? Certified positions, progress, and next steps.",
  robots: { index: false, follow: false },
};

/** PF1 — Portfolio shell over certified investment read models. */
export default function PortfolioPage() {
  return <PortfolioOverview />;
}
