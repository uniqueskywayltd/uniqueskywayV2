import type { ReactNode } from "react";

import CustomerAppLayout from "@/features/customer/components/customer-app-layout";

export default function PortfolioLayout({ children }: { children: ReactNode }) {
  return <CustomerAppLayout>{children}</CustomerAppLayout>;
}
