"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";

import { BrandMark } from "@/components/layout/brand-mark";
import { Button } from "@/components/ui";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { getAdminJson } from "@/features/admin/api-client";
import { postAuthJson } from "@/features/auth/api-client";
import { useI18n } from "@/features/i18n/i18n-provider";
import { LanguageSelector } from "@/features/i18n/language-selector";
import { ADMIN_NAV_SECTIONS } from "@/features/admin/navigation";
import { cn } from "@/lib/utils";

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [isAbsoluteController, setIsAbsoluteController] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getAdminJson<{ isAbsoluteController?: boolean }>("/api/admin/session").then((result) => {
      if (cancelled || !result.data?.isAbsoluteController) return;
      setIsAbsoluteController(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  let activeLabel = t("chrome.admin_console");
  for (const section of ADMIN_NAV_SECTIONS) {
    for (const item of section.items) {
      const active = item.exact
        ? pathname === item.href
        : pathname === item.href || pathname.startsWith(`${item.href}/`);
      if (active) {
        activeLabel = t(item.labelKey);
        break;
      }
    }
  }

  return (
    <div className="min-h-dvh bg-background text-foreground lg:flex">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:shadow-md focus:ring-2 focus:ring-ring"
      >
        {t("chrome.skip_to_content")}
      </a>

      <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-background lg:flex">
        <div className="border-b border-border px-4 py-5">
          <BrandMark surface="theme" width={132} className="[&_img]:max-h-8" />
          <p className="mt-2 text-xs text-muted-foreground">{t("chrome.admin_console")}</p>
          {isAbsoluteController ? (
            <p className="mt-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-primary">
              {t("chrome.absolute_controller")}
            </p>
          ) : null}
        </div>
        <AdminNavLinks pathname={pathname} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between gap-3 border-b border-border bg-background px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open admin menu"
              aria-expanded={mobileOpen}
              aria-controls="admin-mobile-nav"
            >
              <Menu className="h-5 w-5" aria-hidden />
            </Button>
            <p className="min-w-0 truncate text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{activeLabel}</span>
              <span className="ml-2 text-muted-foreground/80">Admin</span>
              {isAbsoluteController ? (
                <span className="ml-2 hidden text-[10px] font-medium uppercase tracking-[0.12em] text-primary sm:inline">
                  {t("chrome.absolute_controller")}
                </span>
              ) : null}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <ThemeToggle compact />
            <LanguageSelector compact />
            <button
              type="button"
              disabled={signingOut}
              className="rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => {
                if (signingOut) return;
                setSigningOut(true);
                void postAuthJson("/api/auth/logout", {}).then((result) => {
                  if (result.error) {
                    setSigningOut(false);
                    return;
                  }
                  router.replace("/auth/login");
                  router.refresh();
                });
              }}
            >
              {signingOut ? t("chrome.signing_out") : t("chrome.sign_out")}
            </button>
          </div>
        </header>

        <DialogPrimitive.Root open={mobileOpen} onOpenChange={setMobileOpen}>
          <DialogPrimitive.Portal>
            <DialogPrimitive.Overlay className="fixed inset-0 z-[var(--z-overlay)] bg-background/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 motion-reduce:animate-none lg:hidden" />
            <DialogPrimitive.Content
              id="admin-mobile-nav"
              aria-describedby={undefined}
              className="fixed inset-y-0 left-0 z-[var(--z-modal)] flex w-[min(100vw-1rem,18rem)] flex-col gap-0 border-r bg-card p-0 text-card-foreground shadow-[var(--elevation-3)] outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left motion-reduce:animate-none lg:hidden"
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-4">
                <div>
                  <DialogPrimitive.Title className="sr-only">Unique Sky Way</DialogPrimitive.Title>
                  <BrandMark
                    surface="theme"
                    width={120}
                    priority={false}
                    className="[&_img]:max-h-8"
                  />
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {t("chrome.admin_console")}
                  </p>
                  {isAbsoluteController ? (
                    <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.12em] text-primary">
                      {t("chrome.absolute_controller")}
                    </p>
                  ) : null}
                </div>
                <DialogPrimitive.Close asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    aria-label={t("admin.close")}
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </Button>
                </DialogPrimitive.Close>
              </div>
              <AdminNavLinks
                pathname={pathname}
                onNavigate={() => setMobileOpen(false)}
                ariaLabel="Admin mobile navigation"
              />
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>

        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-7xl flex-1 space-y-8 p-4 outline-none sm:p-6 lg:p-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}

function AdminNavLinks({
  pathname,
  onNavigate,
  ariaLabel = "Admin navigation",
  className,
}: {
  pathname: string;
  onNavigate?: () => void;
  ariaLabel?: string;
  className?: string;
}) {
  const { t } = useI18n();
  return (
    <nav className={cn("flex-1 space-y-6 overflow-y-auto p-3", className)} aria-label={ariaLabel}>
      {ADMIN_NAV_SECTIONS.map((section) => (
        <div key={section.labelKey}>
          <p className="mb-2 px-2.5 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            {t(section.labelKey)}
          </p>
          <div className="space-y-0.5">
            {section.items.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  {...(onNavigate ? { onClick: onNavigate } : {})}
                  {...(active ? { "aria-current": "page" as const } : {})}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    active
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  {t(item.labelKey)}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
