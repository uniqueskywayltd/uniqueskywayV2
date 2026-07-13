import type { ReactNode } from "react";

import { CustomerShell } from "@/features/customer/components/customer-shell";

/** Shared authenticated money/account chrome for Wave B. */
export default function CustomerAppLayout({ children }: { children: ReactNode }) {
  return <CustomerShell>{children}</CustomerShell>;
}
