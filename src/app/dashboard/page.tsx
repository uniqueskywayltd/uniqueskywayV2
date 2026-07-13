import type { Metadata } from "next";

import { DashboardView } from "@/features/customer/dashboard/dashboard-view";

export const metadata: Metadata = {
  title: "Dashboard | Unique Sky Way",
  description: "Your primary financial home — how you’re doing today.",
  robots: { index: false, follow: false },
};

/**
 * Sprint B5 — Dashboard financial home.
 * Widget composition binds read-only certified customer APIs (`FINANCIAL_DASHBOARD_PRINCIPLES.md`).
 */
export default function DashboardPage() {
  return <DashboardView />;
}
