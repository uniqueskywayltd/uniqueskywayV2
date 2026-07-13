import type { ReactNode } from "react";

import CustomerAppLayout from "@/features/customer/components/customer-app-layout";

export default function WalletLayout({ children }: { children: ReactNode }) {
  return <CustomerAppLayout>{children}</CustomerAppLayout>;
}
