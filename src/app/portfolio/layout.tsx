import type { ReactNode } from "react";

import { DashboardShell } from "@/features/customer/dashboard/dashboard-shell";

/** PF1 — portfolio uses frozen dashboard chrome for platform visual continuity. */
export default function PortfolioLayout({ children }: { children: ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
