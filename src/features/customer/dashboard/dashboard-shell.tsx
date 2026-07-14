"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, Skeleton } from "@/components/ui";
import { brandAssets } from "@/features/brand";
import { getCustomerJson } from "@/features/customer/api-client";
import type { CustomerSummary } from "@/features/customer/types";
import {
  dashboardNavItems,
  getDashboardNavLabel,
} from "@/features/customer/dashboard/dashboard-nav-items";
import { DashboardChromeProvider } from "@/features/customer/dashboard/dashboard-chrome-context";
import { DashboardSignOutButton } from "@/features/customer/dashboard/dashboard-sign-out-button";
import {
  getPersonFullName,
  getPersonHandle,
  getPersonInitials,
} from "@/lib/utils/person-display";
import { getTimeGreeting } from "@/lib/utils/time-greeting";
import { cn } from "@/lib/utils";

type DashboardShellProps = {
  children: ReactNode;
};

function DashboardNavPanel({
  summary,
  onNavigate,
}: {
  summary: CustomerSummary;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const fullName = getPersonFullName(summary);
  const handle = getPersonHandle(summary);
  const initials = getPersonInitials(fullName);

  return (
    <>
      <div className="relative overflow-hidden border-b border-border/60 px-4 py-5">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/12 via-primary/5 to-transparent"
          aria-hidden
        />
        <div className="relative flex items-center gap-3">
          <Avatar className="h-12 w-12 shrink-0 ring-2 ring-primary/20 ring-offset-2 ring-offset-card">
            <AvatarImage src={summary.profile?.avatarUrl ?? brandAssets.icon} alt="" />
            <AvatarFallback className="bg-primary/15 text-sm font-semibold text-primary">
              {initials || "US"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-[10px] font-medium tracking-wide text-primary/80">
              {getTimeGreeting()}
            </p>
            <p className="mt-1.5 truncate text-sm font-semibold text-foreground">{fullName}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">@{handle}</p>
          </div>
        </div>
      </div>

      <nav className="flex flex-col gap-1 p-3" aria-label="Dashboard navigation">
        {dashboardNavItems.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          const onClickProps = onNavigate ? { onClick: onNavigate } : {};
          return (
            <Link
              key={item.href}
              href={item.href}
              {...onClickProps}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm motion-safe:transition-colors motion-safe:duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                active
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [summary, setSummary] = useState<CustomerSummary | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    let active = true;

    void getCustomerJson<CustomerSummary>("/api/customer/summary").then((result) => {
      if (!active) return;

      if (result.error) {
        router.replace(`/auth/login?next=${encodeURIComponent(pathname)}`);
        return;
      }

      setSummary(result.data ?? null);
      setLoaded(true);
    });

    return () => {
      active = false;
    };
  }, [pathname, router]);

  const fullName = summary ? getPersonFullName(summary) : "";
  const initials = useMemo(() => getPersonInitials(fullName || "US"), [fullName]);
  const currentLabel = getDashboardNavLabel(pathname);
  const isOverview = pathname === "/dashboard";

  return (
    <DashboardChromeProvider value={{ summary, loaded }}>
      <div className="min-h-dvh bg-gradient-to-b from-muted/25 via-background to-background lg:flex">
        <a
          href="#dashboard-main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:shadow-md focus:ring-2 focus:ring-ring"
        >
          Skip to dashboard content
        </a>

        <aside className="hidden w-64 shrink-0 flex-col border-r border-border/60 bg-card/80 backdrop-blur-sm lg:sticky lg:top-0 lg:flex lg:h-dvh lg:overflow-y-auto">
          {summary ? (
            <DashboardNavPanel summary={summary} />
          ) : (
            <div className="space-y-3 p-4" aria-busy="true" aria-label="Loading navigation">
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-3/4" />
            </div>
          )}
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 lg:px-8">
            <div className="flex min-w-0 items-center gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10 shrink-0 lg:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation menu"
                aria-expanded={mobileOpen}
                aria-controls="dashboard-mobile-nav"
              >
                <Menu className="h-4 w-4" aria-hidden />
              </Button>
              {summary ? (
                <Avatar className="h-9 w-9 shrink-0 ring-2 ring-primary/15 lg:hidden">
                  <AvatarImage src={summary.profile?.avatarUrl ?? brandAssets.icon} alt="" />
                  <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                    {initials || "US"}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <Skeleton className="h-9 w-9 shrink-0 rounded-full lg:hidden" />
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {isOverview ? "Overview" : currentLabel}
                </p>
                {!isOverview ? (
                  <p className="truncate text-xs text-muted-foreground">Investor portal</p>
                ) : (
                  <p className="truncate text-xs text-muted-foreground lg:hidden">Investor portal</p>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <DashboardSignOutButton />
            </div>
          </header>

          <DialogPrimitive.Root open={mobileOpen} onOpenChange={setMobileOpen}>
            <DialogPrimitive.Portal>
              <DialogPrimitive.Overlay className="fixed inset-0 z-[var(--z-overlay)] bg-background/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 motion-reduce:animate-none lg:hidden" />
              <DialogPrimitive.Content
                id="dashboard-mobile-nav"
                aria-describedby={undefined}
                className="fixed inset-y-0 left-0 z-[var(--z-modal)] flex w-[min(100vw-1rem,20rem)] flex-col gap-0 border-r bg-card p-0 text-card-foreground shadow-[var(--elevation-3)] outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left motion-reduce:animate-none lg:hidden"
              >
                <div className="flex items-center justify-between border-b border-border/60 px-3 py-2">
                  <DialogPrimitive.Title className="px-1 text-sm font-semibold text-foreground">
                    Dashboard navigation
                  </DialogPrimitive.Title>
                  <DialogPrimitive.Close asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      aria-label="Close navigation menu"
                    >
                      <X className="h-4 w-4" aria-hidden />
                    </Button>
                  </DialogPrimitive.Close>
                </div>
                <div className="flex max-h-[calc(100dvh-3.25rem)] flex-col overflow-y-auto">
                  {summary ? (
                    <DashboardNavPanel
                      summary={summary}
                      onNavigate={() => setMobileOpen(false)}
                    />
                  ) : null}
                </div>
              </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
          </DialogPrimitive.Root>

          <main
            id="dashboard-main"
            tabIndex={-1}
            className="mx-auto max-w-6xl space-y-6 px-4 py-5 outline-none sm:space-y-8 sm:py-6 lg:px-8 lg:py-8"
          >
            {children}
          </main>
        </div>
      </div>
    </DashboardChromeProvider>
  );
}
