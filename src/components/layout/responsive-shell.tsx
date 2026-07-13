import type { ReactNode } from "react";

import { Footer, type FooterProps } from "@/components/layout/footer";
import { Sidebar, type SidebarProps } from "@/components/layout/sidebar";
import { TopBar, type TopBarProps } from "@/components/layout/top-bar";

export interface ResponsiveShellProps {
  children: ReactNode;
  topBar?: TopBarProps;
  sidebar?: SidebarProps;
  footer?: FooterProps;
}

export function ResponsiveShell({ children, topBar, sidebar, footer }: ResponsiveShellProps) {
  if (sidebar) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="flex min-h-screen">
          <Sidebar {...sidebar} />
          <div className="flex min-w-0 flex-1 flex-col">
            <TopBar {...(topBar ?? {})} />
            <main className="flex-1">{children}</main>
            <Footer {...(footer ?? {})} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopBar {...(topBar ?? {})} />
      <main>{children}</main>
      <Footer {...(footer ?? {})} />
    </div>
  );
}
