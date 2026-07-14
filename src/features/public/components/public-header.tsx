"use client";

import { useEffect, useId, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Mail, MapPin, Menu, X } from "lucide-react";

import { LanguageSelector } from "@/features/i18n/language-selector";
import { CurrencyTicker } from "@/features/public/components/currency-ticker";
import {
  LEGACY_ACCOUNT_LINKS,
  LEGACY_PRIMARY_NAV,
} from "@/features/public/legacy/nav";
import { LEGACY_ACCENT, LEGACY_NAVY } from "@/features/public/legacy/tokens";
import { cn } from "@/lib/utils";

export function PublicHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [sticky, setSticky] = useState(false);
  const mobileNavId = useId();
  const isHome = pathname === "/";
  /** HP2 acceptance: transparent overlay on homepage until sticky. */
  const overlay = isHome && !sticky;

  useEffect(() => {
    const onScroll = () => setSticky(window.scrollY > 120);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "z-[999] w-full font-[family-name:var(--font-legacy-arimo),Arimo,sans-serif]",
          sticky ? "fixed top-0 right-0 left-0" : isHome ? "absolute top-0 right-0 left-0" : "relative",
        )}
      >
        {!sticky ? <CurrencyTicker /> : null}

        <div
          className={cn(
            "transition-[background-color,box-shadow] duration-500",
            sticky
              ? "bg-white shadow-[0_10px_20px_rgba(0,0,0,0.2)]"
              : overlay
                ? "bg-transparent"
                : "bg-[color:var(--legacy-navy)]",
          )}
          style={{ ["--legacy-navy" as string]: LEGACY_NAVY }}
        >
          {!sticky ? (
            <div className="mx-auto flex max-w-[1170px] justify-end px-4 pt-2 sm:px-[15px]">
              <LanguageSelector
                className="rounded bg-white/95 px-1 text-[#000044] shadow-sm [&_button]:min-w-[7rem] [&_button]:text-[#000044]"
                compact
              />
            </div>
          ) : null}

          <div className="mx-auto flex max-w-[1170px] items-center justify-between gap-4 px-4 sm:px-[15px]">
            <Link href="/" className="shrink-0 py-3" aria-label="UniqueSkyWay">
              <Image
                src="/legacy/small-logo.png"
                alt="UniqueSkyWay"
                width={100}
                height={70}
                className={cn(
                  "h-[70px] w-[100px] object-contain",
                  sticky ? "" : "brightness-0 invert",
                )}
                priority
              />
            </Link>

            <nav className="hidden items-center lg:flex" aria-label="Primary">
              <ul className="flex items-center">
                {LEGACY_PRIMARY_NAV.map((item) => {
                  const active =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <li key={item.href} className="px-1">
                      <Link
                        href={item.href}
                        className={cn(
                          "relative block px-3 py-[18px] text-[15px] font-bold tracking-[0.02em] uppercase transition-colors",
                          sticky
                            ? active
                              ? "text-[#da2c46]"
                              : "text-[#222] hover:text-[#da2c46]"
                            : active
                              ? "text-white"
                              : "text-white/90 hover:text-white",
                        )}
                        aria-current={active ? "page" : undefined}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
                <li className="relative px-1">
                  <button
                    type="button"
                    className={cn(
                      "flex items-center gap-1 px-3 py-[18px] text-[15px] font-bold tracking-[0.02em] uppercase",
                      sticky ? "text-[#222] hover:text-[#da2c46]" : "text-white",
                    )}
                    aria-expanded={accountOpen}
                    onClick={() => setAccountOpen((value) => !value)}
                  >
                    Account
                    <ChevronDown className="size-3.5" aria-hidden="true" />
                  </button>
                  {accountOpen ? (
                    <ul className="absolute top-full left-0 z-20 min-w-[160px] bg-white py-2 shadow-lg">
                      {LEGACY_ACCOUNT_LINKS.map((link) => (
                        <li key={link.href}>
                          <Link
                            href={link.href}
                            className="block px-4 py-2 text-sm font-semibold text-[#222] hover:text-[#da2c46]"
                            onClick={() => setAccountOpen(false)}
                          >
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              </ul>
              <div
                className={cn(
                  "ml-6 border-l pl-6",
                  sticky ? "border-[#ddd]" : "border-white/50",
                )}
              >
                <Link
                  href="/auth/register"
                  className="inline-block px-7 py-2.5 text-base font-bold text-white"
                  style={{ background: LEGACY_NAVY }}
                >
                  Free account
                </Link>
              </div>
            </nav>

            <button
              type="button"
              className={cn(
                "inline-flex size-10 items-center justify-center border lg:hidden",
                sticky ? "border-[#ddd] text-[#222]" : "border-white/40 text-white",
              )}
              aria-expanded={open}
              aria-controls={mobileNavId}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
              <span className="sr-only">{open ? "Close navigation" : "Open navigation"}</span>
            </button>
          </div>
        </div>
      </header>

      {open ? (
        <div className="fixed inset-0 z-[1000] lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="Close navigation backdrop"
            onClick={() => setOpen(false)}
          />
          <nav
            id={mobileNavId}
            aria-label="Mobile primary"
            className="absolute inset-y-0 right-0 flex w-[min(100%,320px)] flex-col bg-white font-[family-name:var(--font-legacy-arimo),Arimo,sans-serif] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b p-4">
              <Image
                src="/legacy/mobile-logo.png"
                alt="UniqueSkyWay"
                width={100}
                height={100}
                className="h-[100px] w-[100px] rounded bg-white object-contain"
              />
              <button
                type="button"
                className="p-2 text-[#222]"
                onClick={() => setOpen(false)}
                aria-label="Close navigation"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
            <div className="border-b px-3 py-3">
              <LanguageSelector compact={false} className="w-full" />
            </div>
            <ul className="flex-1 space-y-1 overflow-y-auto p-3">
              {LEGACY_PRIMARY_NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="block rounded px-3 py-3 text-sm font-bold uppercase text-[#222] hover:text-[#da2c46]"
                    onClick={() => setOpen(false)}
                    style={{ color: pathname === item.href ? LEGACY_ACCENT : undefined }}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              {LEGACY_ACCOUNT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="block rounded px-3 py-3 text-sm font-bold uppercase text-[#222] hover:text-[#da2c46]"
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li className="pt-2">
                <Link
                  href="/auth/register"
                  className="block px-3 py-3 text-center text-sm font-bold text-white"
                  style={{ background: LEGACY_NAVY }}
                  onClick={() => setOpen(false)}
                >
                  Free account
                </Link>
              </li>
            </ul>
            <div className="space-y-2 border-t p-4 text-sm text-[#666]">
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                Fayetteville ARKANSAS, United Stated of Ameriaca
              </p>
              <p className="flex items-start gap-2">
                <Mail className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <a href="mailto:support@uniqueskyway.ltd">support@uniqueskyway.ltd</a>
              </p>
            </div>
          </nav>
        </div>
      ) : null}

      {sticky ? <div className="h-[102px]" aria-hidden="true" /> : null}
    </>
  );
}
