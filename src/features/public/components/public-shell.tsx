import type { ReactNode } from "react";

import { PageContainer } from "@/components/layout/page-container";
import { CurrencyTicker } from "@/features/public/components/currency-ticker";
import { PublicFooter } from "@/features/public/components/public-footer";
import { PublicHeader } from "@/features/public/components/public-header";

export function PublicShell({
  children,
  showMarketTicker = true,
}: {
  children: ReactNode;
  showMarketTicker?: boolean;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <PublicHeader />
      {showMarketTicker ? <CurrencyTicker /> : null}
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}

export function PublicPageContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <PageContainer size="page" {...(className ? { className } : {})}>
      {children}
    </PageContainer>
  );
}
