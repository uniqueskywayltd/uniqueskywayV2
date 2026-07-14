import type { ReactNode } from "react";

import { BrandMark } from "@/components/layout/brand-mark";
import { cn } from "@/lib/utils";

export interface TopBarAction {
  label: string;
  href: string;
}

export interface TopBarProps {
  actions?: readonly TopBarAction[];
  trailing?: ReactNode;
  className?: string;
}

export function TopBar({ actions = [], trailing, className }: TopBarProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-[var(--z-sticky)] border-b bg-background/95 backdrop-blur",
        className,
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-[90rem] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <BrandMark surface="theme" />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {actions.map((action) => (
            <a
              key={action.href}
              href={action.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {action.label}
            </a>
          ))}
        </nav>
        {trailing ? <div className="flex items-center gap-2">{trailing}</div> : null}
      </div>
    </header>
  );
}
