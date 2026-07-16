"use client";

import type { MouseEventHandler, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ChevronDown, Menu } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge, Button, Skeleton } from "@/components/ui";
import { BrandMark } from "@/components/layout/brand-mark";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { brandAssets } from "@/features/brand";
import { CUSTOMER_MOBILE_BOTTOM_NAV, CUSTOMER_PRIMARY_NAV } from "@/features/customer/navigation";
import { LanguageSelector } from "@/features/i18n/language-selector";
import { useI18n } from "@/features/i18n/i18n-provider";
import { cn } from "@/lib/utils";

import { getCustomerJson } from "../api-client";
import type { CustomerSummary } from "../types";
import { getPersonFullName, getPersonInitials } from "@/lib/utils/person-display";
import { SessionInactivityGuard } from "@/features/auth/components/session-inactivity-guard";

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
    // Load once per shell mount — avoid refetch waterfall on every route change.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional mount-only fetch
  }, [router]);

  const initials = useMemo(() => {
    if (!summary) return "US";
    return getPersonInitials(getPersonFullName(summary)) || "US";
  }, [summary]);

  const moneyNav = CUSTOMER_PRIMARY_NAV.filter((item) => item.group === "money");
  const accountNav = CUSTOMER_PRIMARY_NAV.filter((item) => item.group === "account");
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SessionInactivityGuard loginPath="/auth/login" />{" "}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r bg-sidebar lg:flex lg:flex-col">
        <div className="border-b p-5">
          <BrandMark surface="theme" />
        </div>
        <nav className="flex-1 space-y-6 overflow-y-auto p-3" aria-label="Customer navigation">
          <NavGroup label={t("nav.money")} items={moneyNav} pathname={pathname} summary={summary} />
          <NavGroup
            label={t("nav.account_group")}
            items={accountNav}
            pathname={pathname}
            summary={summary}
          />
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
                <BrandMark surface="theme" width={120} className="[&_img]:h-auto [&_img]:max-h-8" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle compact />
              <div className="hidden sm:block">
                <LanguageSelector />
              </div>
              <Link
                href="/account/notifications"
                className="relative rounded-md border px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <Bell className="size-4" aria-hidden="true" />
                <span className="sr-only">{t("chrome.notifications")}</span>
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
                    <AvatarImage src={summary.profile?.avatarUrl ?? brandAssets.icon} alt="" />
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
                label={t("nav.money")}
                items={moneyNav}
                pathname={pathname}
                summary={summary}
                onNavigate={() => setMobileOpen(false)}
              />
              <NavGroup
                label={t("nav.account_group")}
                items={accountNav}
                pathname={pathname}
                summary={summary}
                onNavigate={() => setMobileOpen(false)}
              />
              <div className="border-t pt-3 sm:hidden">
                <div className="mb-3 flex items-center gap-2">
                  <ThemeToggle compact />
                </div>
                <LanguageSelector compact={false} />
              </div>
            </nav>
          ) : null}
        </header>
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-6xl px-4 py-6 pb-24 outline-none sm:px-6 lg:py-8 lg:pb-8"
        >
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
                  {t(item.labelKey)}
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
  const { t } = useI18n();

  return (
    <div>
      <p className="px-3 pb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <div className="space-y-1">
        {items.map((item) => {
          const badgeProps = notificationBadgeProps(item.href, summary?.unreadNotificationCount);
          return (
            <CustomerNavLink
              key={item.href}
              href={item.href}
              label={t(item.labelKey)}
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
        <AvatarImage src={summary.profile?.avatarUrl ?? brandAssets.icon} alt="" />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{getPersonFullName(summary)}</p>
        <p className="truncate text-xs text-muted-foreground">{summary.user.email}</p>
      </div>
    </div>
  );
}
