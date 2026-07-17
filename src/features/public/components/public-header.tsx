"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Menu, X } from "lucide-react";

import { BrandMark } from "@/components/layout/brand-mark";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { LanguageSelector } from "@/features/i18n/language-selector";
import { useI18n } from "@/features/i18n/i18n-provider";
import {
  marketingHeaderOutlineBtn,
  marketingHeaderPrimaryBtn,
} from "@/features/public/components/marketing-ui";
import { PUBLIC_MOBILE_NAV, PUBLIC_PRIMARY_NAV } from "@/features/public/navigation";
import { cn } from "@/lib/utils";

function useIsClient() {
  return useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
}

function NavLink({
  href,
  label,
  onClick,
  mobile,
}: {
  href: string;
  label: string;
  onClick?: () => void;
  mobile?: boolean;
}) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

  return (
    <Link
      href={href}
      {...(onClick ? { onClick } : {})}
      {...(active ? { "aria-current": "page" as const } : {})}
      className={cn(
        "relative font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        mobile ? "rounded-lg px-3 py-3 text-base" : "py-2 text-sm",
        active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
        !mobile &&
          "after:absolute after:bottom-0 after:start-0 after:h-px after:w-full after:bg-primary after:transition-transform after:duration-200 after:content-['']",
        !mobile &&
          (active
            ? "after:scale-x-100"
            : "after:origin-left after:scale-x-0 hover:after:scale-x-100 rtl:after:origin-right"),
        mobile && active && "bg-muted text-foreground",
      )}
    >
      {label}
    </Link>
  );
}

function HeaderControls({
  mobileOpen,
  onToggleMenu,
  showMenuButton,
}: {
  mobileOpen: boolean;
  onToggleMenu: () => void;
  showMenuButton: boolean;
}) {
  const { t } = useI18n();

  return (
    <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
      <ThemeToggle compact className="size-11 shrink-0 sm:size-9" />
      <LanguageSelector />
      {showMenuButton ? (
        <button
          type="button"
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
          onClick={onToggleMenu}
          aria-expanded={mobileOpen}
          aria-controls="public-mobile-nav"
          aria-label={mobileOpen ? t("chrome.close_nav") : t("chrome.open_nav")}
        >
          {mobileOpen ? (
            <X className="h-5 w-5" aria-hidden />
          ) : (
            <Menu className="h-5 w-5" aria-hidden />
          )}
        </button>
      ) : null}
    </div>
  );
}

/**
 * Mobile drawer is portaled to document.body.
 * Root cause: a `position:fixed` panel inside a header with `backdrop-filter`
 * is trapped in that header's containing block, so the menu never covers the viewport.
 */
function PublicMobileNavDrawer({
  open,
  onClose,
  titleId,
}: {
  open: boolean;
  onClose: () => void;
  titleId: string;
}) {
  const { t } = useI18n();
  const mounted = useIsClient();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      id="public-mobile-nav"
      className="fixed inset-0 z-[var(--z-modal)] flex flex-col bg-background md:hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="flex h-[4.25rem] items-center justify-between gap-2 border-b border-border/50 px-3 sm:px-4">
        <BrandMark
          surface="theme"
          width={112}
          className="min-w-0 shrink [&_img]:h-auto [&_img]:w-[88px] sm:[&_img]:w-[100px]"
        />
        <span id={titleId} className="sr-only">
          {t("chrome.open_nav")}
        </span>
        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <ThemeToggle compact className="size-11 shrink-0 sm:size-9" />
          <LanguageSelector />
          <button
            type="button"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={onClose}
            aria-label={t("chrome.close_nav")}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>

      <nav
        className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-4 py-4"
        aria-label={t("chrome.open_nav")}
      >
        {PUBLIC_MOBILE_NAV.map((link) => (
          <NavLink
            key={link.href}
            href={link.href}
            label={t(link.labelKey)}
            mobile
            onClick={onClose}
          />
        ))}
        <div className="mt-auto flex flex-col gap-2.5 border-t border-border/50 pt-4 pb-6">
          <Link
            href="/auth/login"
            className={cn(marketingHeaderOutlineBtn(), "h-11 w-full justify-center")}
            onClick={onClose}
          >
            {t("chrome.sign_in")}
          </Link>
          <Link
            href="/auth/register"
            className={cn(marketingHeaderPrimaryBtn(), "h-11 w-full justify-center")}
            onClick={onClose}
          >
            {t("chrome.open_account")}
          </Link>
        </div>
      </nav>
    </div>,
    document.body,
  );
}

export function PublicHeader() {
  const pathname = usePathname();
  const { t } = useI18n();
  const titleId = useId();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuPath, setMenuPath] = useState(pathname);

  // Close drawer on navigation without an effect (avoids set-state-in-effect lint).
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    if (mobileOpen) setMobileOpen(false);
  }

  return (
    <header className="sticky top-0 z-[var(--z-sticky)] border-b border-border/50 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-[4.25rem] max-w-7xl items-center justify-between gap-2 px-3 sm:gap-3 sm:px-6 lg:px-8">
        <BrandMark
          surface="theme"
          width={128}
          className="min-w-0 max-w-[6.5rem] shrink sm:max-w-[9rem] md:max-w-none [&_img]:h-auto [&_img]:w-[80px] sm:[&_img]:w-[112px] md:[&_img]:w-[128px]"
        />

        <nav className="hidden items-center gap-10 lg:flex" aria-label={t("nav.home")}>
          {PUBLIC_PRIMARY_NAV.map((link) => (
            <NavLink key={link.href} href={link.href} label={t(link.labelKey)} />
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
          <HeaderControls
            mobileOpen={mobileOpen}
            onToggleMenu={() => setMobileOpen((open) => !open)}
            showMenuButton
          />
          <div className="hidden items-center gap-1.5 md:flex">
            <Link href="/auth/login" className={marketingHeaderOutlineBtn()}>
              {t("chrome.sign_in")}
            </Link>
            <Link href="/auth/register" className={marketingHeaderPrimaryBtn()}>
              {t("chrome.open_account")}
            </Link>
          </div>
        </div>
      </div>

      <PublicMobileNavDrawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        titleId={titleId}
      />
    </header>
  );
}
