import type { Metadata } from "next";

import { PortfolioOverview } from "@/features/customer/portfolio/portfolio-overview";

export const metadata: Metadata = {
  title: "Investments | Unique Sky Way",
  description: "How are my investments performing? Certified positions, progress, and next steps.",
  robots: { index: false, follow: false },
};

/** PF1–PF5 — Portfolio certified: explains investments over certified reads. */
export default function PortfolioPage() {
  return <PortfolioOverview />;
}
