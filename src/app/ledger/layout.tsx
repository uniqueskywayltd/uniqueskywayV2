import type { ReactNode } from "react";

import CustomerAppLayout from "@/features/customer/components/customer-app-layout";

export default function LedgerLayout({ children }: { children: ReactNode }) {
  return <CustomerAppLayout>{children}</CustomerAppLayout>;
}
