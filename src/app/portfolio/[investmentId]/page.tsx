import type { Metadata } from "next";

import { InvestmentDetailView } from "@/features/customer/portfolio/investment-detail-view";

type PageProps = {
  params: Promise<{ investmentId: string }>;
};

export const metadata: Metadata = {
  title: "Investment | Unique Sky Way",
  description: "How this investment is progressing — read-only detail.",
  robots: { index: false, follow: false },
};

/** PF3 — Investment passport over certified investment detail. */
export default async function InvestmentDetailPage({ params }: PageProps) {
  const { investmentId } = await params;
  return <InvestmentDetailView investmentId={investmentId} />;
}
