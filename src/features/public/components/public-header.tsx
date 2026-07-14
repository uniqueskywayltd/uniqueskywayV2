"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
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
        mobile ? "rounded-lg px-3 py-2.5 text-base" : "py-2 text-sm",
        active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
        !mobile &&
          "after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:bg-primary after:transition-transform after:duration-200 after:content-['']",
        !mobile &&
          (active
            ? "after:scale-x-100"
            : "after:origin-left after:scale-x-0 hover:after:scale-x-100"),
        mobile && active && "bg-muted/50 text-foreground",
      )}
    >
      {label}
    </Link>
  );
}

export function PublicHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useI18n();

  return (
    <header className="relative z-40 border-b border-border/50 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-[4.25rem] max-w-7xl items-center justify-between gap-3 px-4 sm:gap-6 sm:px-6 lg:px-8">
        <BrandMark
          surface="onLight"
          className="min-w-0 max-w-[45%] shrink sm:max-w-none [&_img]:h-9 [&_img]:w-auto [&_img]:max-w-[128px] sm:[&_img]:h-10"
        />

        <nav className="hidden items-center gap-10 lg:flex" aria-label="Main navigation">
          {PUBLIC_PRIMARY_NAV.map((link) => (
            <NavLink key={link.href} href={link.href} label={t(link.labelKey)} />
          ))}
        </nav>

        <div className="hidden items-center gap-1.5 md:flex">
          <ThemeToggle compact />
          <LanguageSelector compact />
          <Link href="/auth/login" className={marketingHeaderOutlineBtn()}>
            {t("chrome.sign_in")}
          </Link>
          <Link href="/auth/register" className={marketingHeaderPrimaryBtn()}>
            {t("chrome.open_account")}
          </Link>
        </div>

        <div className="flex shrink-0 items-center gap-0.5 md:hidden">
          <ThemeToggle compact />
          <LanguageSelector compact />
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? t("chrome.close_nav") : t("chrome.open_nav")}
          >
            {mobileOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="border-t border-border/50 bg-background px-4 py-5 md:hidden">
          <nav className="flex flex-col gap-0.5" aria-label="Mobile navigation">
            {PUBLIC_MOBILE_NAV.map((link) => (
              <NavLink
                key={link.href}
                href={link.href}
                label={t(link.labelKey)}
                mobile
                onClick={() => setMobileOpen(false)}
              />
            ))}
            <div className="mt-4 flex flex-col gap-2.5 border-t border-border/50 pt-4">
              <Link
                href="/auth/login"
                className={cn(marketingHeaderOutlineBtn(), "h-11 w-full")}
                onClick={() => setMobileOpen(false)}
              >
                {t("chrome.sign_in")}
              </Link>
              <Link
                href="/auth/register"
                className={cn(marketingHeaderPrimaryBtn(), "h-11 w-full")}
                onClick={() => setMobileOpen(false)}
              >
                {t("chrome.open_account")}
              </Link>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
