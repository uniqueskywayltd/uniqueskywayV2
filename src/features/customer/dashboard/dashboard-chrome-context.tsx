"use client";

import { createContext, useContext } from "react";

import type { CustomerSummary } from "@/features/customer/types";

export type DashboardChromeValue = {
  summary: CustomerSummary | null;
  loaded: boolean;
};

const DashboardChromeContext = createContext<DashboardChromeValue>({
  summary: null,
  loaded: false,
});

export function DashboardChromeProvider({
  value,
  children,
}: {
  value: DashboardChromeValue;
  children: React.ReactNode;
}) {
  return (
    <DashboardChromeContext.Provider value={value}>{children}</DashboardChromeContext.Provider>
  );
}

export function useDashboardChrome(): DashboardChromeValue {
  return useContext(DashboardChromeContext);
}
