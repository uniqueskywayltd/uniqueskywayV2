"use client";

import type { MouseEventHandler, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ChevronDown, Menu } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge, Button, Skeleton } from "@/components/ui";
import { BrandMark } from "@/components/layout/brand-mark";
import {
  CUSTOMER_MOBILE_BOTTOM_NAV,
  CUSTOMER_PRIMARY_NAV,
} from "@/features/customer/navigation";
import { cn } from "@/lib/utils";

import { getCustomerJson } from "../api-client";
import type { CustomerSummary } from "../types";

export interface CustomerShellProps {
  children: ReactNode;
}

export function CustomerShell({ children }: CustomerShellProps) {
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

  const initials = useMemo(() => {
    const name =
      summary?.profile?.displayName ?? summary?.profile?.legalName ?? summary?.user.email ?? "US";
    return name
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }, [summary]);

  const moneyNav = CUSTOMER_PRIMARY_NAV.filter((item) => item.group === "money");
  const accountNav = CUSTOMER_PRIMARY_NAV.filter((item) => item.group === "account");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r bg-sidebar lg:flex lg:flex-col">
        <div className="border-b p-5">
          <BrandMark />
        </div>
        <nav className="flex-1 space-y-6 overflow-y-auto p-3" aria-label="Customer navigation">
          <NavGroup label="Money" items={moneyNav} pathname={pathname} summary={summary} />
          <NavGroup label="Account" items={accountNav} pathname={pathname} summary={summary} />
        </nav>
        <div className="border-t p-4">
          {loaded && summary ? (
            <CustomerIdentityBlock summary={summary} initials={initials || "US"} />
          ) : (
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          )}
        </div>
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
                aria-controls="customer-mobile-navigation"
              >
                <Menu className="size-4" aria-hidden="true" />
                <span className="sr-only">Toggle navigation</span>
              </Button>
              <div className="lg:hidden">
                <BrandMark />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/account/notifications"
                className="relative rounded-md border px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <Bell className="size-4" aria-hidden="true" />
                <span className="sr-only">Notifications</span>
                {summary?.unreadNotificationCount ? (
                  <span className="absolute -right-1 -top-1 size-2 rounded-full bg-destructive" />
                ) : null}
              </Link>
              {summary ? (
                <Link
                  href="/account/profile"
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                >
                  <Avatar className="size-8">
                    {summary.profile?.avatarUrl ? (
                      <AvatarImage src={summary.profile.avatarUrl} alt="" />
                    ) : null}
                    <AvatarFallback>{initials || "US"}</AvatarFallback>
                  </Avatar>
                  <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />
                </Link>
              ) : null}
            </div>
          </div>
          {mobileOpen ? (
            <nav
              id="customer-mobile-navigation"
              className="max-h-[70vh] space-y-4 overflow-y-auto border-t p-3 lg:hidden"
              aria-label="Customer mobile navigation"
            >
              <NavGroup
                label="Money"
                items={moneyNav}
                pathname={pathname}
                summary={summary}
                onNavigate={() => setMobileOpen(false)}
              />
              <NavGroup
                label="Account"
                items={accountNav}
                pathname={pathname}
                summary={summary}
                onNavigate={() => setMobileOpen(false)}
              />
            </nav>
          ) : null}
        </header>
        <main className="mx-auto w-full max-w-6xl px-4 py-6 pb-24 sm:px-6 lg:py-8 lg:pb-8">
          {children}
        </main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 backdrop-blur lg:hidden"
        aria-label="Primary mobile destinations"
      >
        <ul className="grid grid-cols-5 gap-1 px-1 py-2">
          {CUSTOMER_MOBILE_BOTTOM_NAV.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/account"
                ? pathname.startsWith("/account")
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-md px-1 py-2 text-[11px] font-medium text-muted-foreground",
                    active && "text-foreground",
                  )}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

function NavGroup({
  label,
  items,
  pathname,
  summary,
  onNavigate,
}: {
  label: string;
  items: ReadonlyArray<(typeof CUSTOMER_PRIMARY_NAV)[number]>;
  pathname: string;
  summary: CustomerSummary | null;
  onNavigate?: MouseEventHandler<HTMLAnchorElement>;
}) {
  return (
    <div>
      <p className="px-3 pb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <div className="space-y-1">
        {items.map((item) => {
            const badgeProps = notificationBadgeProps(
              item.href,
              summary?.unreadNotificationCount,
            );
            return (
              <CustomerNavLink
                key={item.href}
                href={item.href}
                label={item.label}
                active={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                icon={item.icon}
                {...(onNavigate ? { onNavigate } : {})}
                {...badgeProps}
              />
            );
          })}
      </div>
    </div>
  );
}

function CustomerNavLink({
  href,
  label,
  active,
  icon: Icon,
  badge,
  onNavigate,
}: {
  href: string;
  label: string;
  active: boolean;
  icon: (typeof CUSTOMER_PRIMARY_NAV)[number]["icon"];
  badge?: number;
  onNavigate?: MouseEventHandler<HTMLAnchorElement>;
}) {
  const onClickProps = onNavigate ? { onClick: onNavigate } : {};

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      {...onClickProps}
      className={cn(
        "flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
        active && "bg-accent text-foreground",
      )}
    >
      <span className="flex items-center gap-3">
        <Icon className="size-4" aria-hidden="true" />
        {label}
      </span>
      {badge ? <Badge variant="destructive">{badge}</Badge> : null}
    </Link>
  );
}

function notificationBadgeProps(href: string, unreadCount?: number): { badge?: number } {
  return href === "/account/notifications" && unreadCount ? { badge: unreadCount } : {};
}

function CustomerIdentityBlock({
  summary,
  initials,
}: {
  summary: CustomerSummary;
  initials: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar className="size-10">
        {summary.profile?.avatarUrl ? <AvatarImage src={summary.profile.avatarUrl} alt="" /> : null}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">
          {summary.profile?.displayName ?? summary.profile?.legalName ?? "Unique Sky Way"}
        </p>
        <p className="truncate text-xs text-muted-foreground">{summary.user.email}</p>
      </div>
    </div>
  );
}
