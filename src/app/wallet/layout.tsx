import type { ReactNode } from "react";

import { DashboardShell } from "@/features/customer/dashboard/dashboard-shell";

/** WP1 — wallet uses the frozen dashboard chrome for platform visual continuity. */
export default function WalletLayout({ children }: { children: ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
