"use client";

import { usePathname } from "next/navigation";

import { CurrencyTicker } from "@/features/public/components/currency-ticker";

/** Platform parity: market overview strip appears on the homepage only. */
export function HomepageCurrencyTicker() {
  const pathname = usePathname();
  if (pathname !== "/") return null;
  return <CurrencyTicker />;
}
