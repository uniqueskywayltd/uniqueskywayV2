import type { ReactNode } from "react";

import { CustomerInactivityGuard } from "@/features/customer/components/customer-inactivity-guard";
import { CustomerShell } from "@/features/customer/components/customer-shell";

/** Shared authenticated money/account chrome for Wave B. */
export default function CustomerAppLayout({ children }: { children: ReactNode }) {
  return (
    <CustomerShell>
      <CustomerInactivityGuard />
      {children}
    </CustomerShell>
  );
}
