import type { ReactNode } from "react";

import { CustomerShell } from "@/features/customer/components/customer-shell";

export default function AccountLayout({ children }: { children: ReactNode }) {
  return <CustomerShell>{children}</CustomerShell>;
}
