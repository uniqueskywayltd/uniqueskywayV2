import type { ReactNode } from "react";

import { DashboardShell } from "@/features/customer/dashboard/dashboard-shell";

/** Bundle 1 — Profile & Security share money chrome with Dashboard / Wallet / Portfolio. */
export default function AccountLayout({ children }: { children: ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
