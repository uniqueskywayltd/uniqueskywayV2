"use client";

import type { MouseEventHandler, ReactNode } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import { BrandMark } from "@/components/layout/brand-mark";
import { Badge, Button } from "@/components/ui";
import { cn } from "@/lib/utils";

import { ADMIN_NAVIGATION } from "../navigation";

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeLabel = useMemo(
    () =>
      ADMIN_NAVIGATION.find(
        (item) =>
          pathname === item.href || (item.href !== "/admin" && pathname.startsWith(`${item.href}/`)),
      )?.label ?? "Admin",
    [pathname],
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r bg-sidebar lg:flex lg:flex-col">
        <div className="border-b p-5">
          <BrandMark />
          <p className="mt-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Administrative console
          </p>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Admin navigation">
          {ADMIN_NAVIGATION.map((item) => (
            <AdminNavLink
              key={item.href}
              href={item.href}
              label={item.label}
              description={item.description}
              active={
                pathname === item.href ||
                (item.href !== "/admin" && pathname.startsWith(`${item.href}/`))
              }
              icon={item.icon}
            />
          ))}
        </nav>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileOpen((open) => !open)}
                aria-expanded={mobileOpen}
                aria-controls="admin-mobile-navigation"
              >
                <Menu className="size-4" aria-hidden="true" />
                <span className="sr-only">Toggle navigation</span>
              </Button>
              <div className="lg:hidden">
                <BrandMark compact />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium">{activeLabel}</p>
                <p className="text-xs text-muted-foreground">Unique Sky Way operations</p>
              </div>
            </div>
            <Badge variant="secondary">Admin</Badge>
          </div>
          {mobileOpen ? (
            <nav
              id="admin-mobile-navigation"
              className="max-h-[70vh] space-y-1 overflow-y-auto border-t p-3 lg:hidden"
              aria-label="Admin mobile navigation"
            >
              {ADMIN_NAVIGATION.map((item) => (
                <AdminNavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  description={item.description}
                  active={
                    pathname === item.href ||
                    (item.href !== "/admin" && pathname.startsWith(`${item.href}/`))
                  }
                  icon={item.icon}
                  onNavigate={() => setMobileOpen(false)}
                />
              ))}
            </nav>
          ) : null}
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

function AdminNavLink({
  href,
  label,
  description,
  active,
  icon: Icon,
  onNavigate,
}: {
  href: string;
  label: string;
  description: string;
  active: boolean;
  icon: (typeof ADMIN_NAVIGATION)[number]["icon"];
  onNavigate?: MouseEventHandler<HTMLAnchorElement>;
}) {
  const onClickProps = onNavigate ? { onClick: onNavigate } : {};
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      {...onClickProps}
      className={cn(
        "block rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
        active && "bg-accent text-foreground",
      )}
    >
      <span className="flex items-center gap-3 font-medium">
        <Icon className="size-4 shrink-0" aria-hidden="true" />
        {label}
      </span>
      <span className="mt-1 block pl-7 text-xs text-muted-foreground">{description}</span>
    </Link>
  );
}
