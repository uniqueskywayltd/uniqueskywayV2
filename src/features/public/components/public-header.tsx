"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

import { BrandMark } from "@/components/layout/brand-mark";
import { Button } from "@/components/ui";
import { LanguageSelector } from "@/features/i18n/language-selector";
import { PUBLIC_PRIMARY_NAV } from "@/features/public/navigation";
import { marketingTransitionClassName } from "@/features/public/components/motion";
import { cn } from "@/lib/utils";

export function PublicHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-[var(--z-sticky)] border-b border-border/80 bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-[90rem] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <BrandMark />
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {PUBLIC_PRIMARY_NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  marketingTransitionClassName("fast"),
                  "rounded-md px-3 py-2 text-sm font-medium",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          <LanguageSelector />
          <Button asChild variant="ghost" size="sm">
            <Link href="/contact">Contact</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/auth/login">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/auth/register">Get started</Link>
          </Button>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="lg:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="public-mobile-navigation"
        >
          {open ? <X className="size-4" aria-hidden="true" /> : <Menu className="size-4" aria-hidden="true" />}
          <span className="sr-only">{open ? "Close navigation" : "Open navigation"}</span>
        </Button>
      </div>
      {open ? (
        <nav
          id="public-mobile-navigation"
          className="border-t bg-background lg:hidden"
          aria-label="Mobile primary"
        >
          <div className="mx-auto flex max-w-[90rem] flex-col gap-1 px-4 py-3 sm:px-6">
            {PUBLIC_PRIMARY_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-3 text-sm font-medium text-foreground"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 grid gap-2 border-t pt-3">
              <LanguageSelector compact={false} />
              <Button asChild variant="outline">
                <Link href="/auth/login" onClick={() => setOpen(false)}>
                  Sign in
                </Link>
              </Button>
              <Button asChild>
                <Link href="/auth/register" onClick={() => setOpen(false)}>
                  Get started
                </Link>
              </Button>
            </div>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
