import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { BrandMark } from "@/components/layout/brand-mark";
import { cn } from "@/lib/utils";

export interface SidebarItem {
  label: string;
  href: string;
  icon?: LucideIcon;
  active?: boolean;
}

export interface SidebarProps {
  items: readonly SidebarItem[];
  footer?: ReactNode;
  className?: string;
}

export function Sidebar({ items, footer, className }: SidebarProps) {
  return (
    <aside
      className={cn("hidden min-h-screen w-72 border-r bg-sidebar lg:flex lg:flex-col", className)}
    >
      <div className="border-b p-5">
        <BrandMark surface="theme" />
      </div>
      <nav className="flex-1 space-y-1 p-3" aria-label="Sidebar">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <a
              key={item.href}
              href={item.href}
              aria-current={item.active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                item.active && "bg-sidebar-accent text-sidebar-accent-foreground",
              )}
            >
              {Icon ? <Icon className="size-4" aria-hidden="true" /> : null}
              {item.label}
            </a>
          );
        })}
      </nav>
      {footer ? <div className="border-t p-4">{footer}</div> : null}
    </aside>
  );
}
