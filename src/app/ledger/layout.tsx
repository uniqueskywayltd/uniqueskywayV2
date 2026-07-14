import type { ReactNode } from "react";

import { DashboardShell } from "@/features/customer/dashboard/dashboard-shell";

/** LP1 — Ledger shares money chrome with Wallet / Portfolio / Dashboard. */
export default function LedgerLayout({ children }: { children: ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
