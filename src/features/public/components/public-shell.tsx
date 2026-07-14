import type { ReactNode } from "react";

import { PageContainer } from "@/components/layout/page-container";
import { HomepageCurrencyTicker } from "@/features/public/components/homepage/homepage-currency-ticker";
import { PublicFooter } from "@/features/public/components/public-footer";
import { PublicHeader } from "@/features/public/components/public-header";

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <PublicHeader />
      <HomepageCurrencyTicker />
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
