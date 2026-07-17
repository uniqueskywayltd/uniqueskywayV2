"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ShieldCheck, Sparkles } from "lucide-react";

import { BrandMark } from "@/components/layout/brand-mark";
import { AuthChromeControls } from "@/features/auth/components/auth-chrome";
import { useI18n } from "@/features/i18n/i18n-provider";
import { cn } from "@/lib/utils";

export interface AuthShellProps {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  panelTitle?: string;
  panelDescription?: string;
  panelImage?: string;
  panelImageAlt?: string;
  panelHighlights?: string[];
  className?: string;
}

export function AuthShell({
  title,
  description,
  children,
  footer,
  panelTitle,
  panelDescription,
  panelImage = "/brand/portfolio.webp",
  panelImageAlt,
  panelHighlights,
  className,
}: AuthShellProps) {
  const { t } = useI18n();
  const resolvedPanelTitle = panelTitle ?? t("auth.panel.default_title");
  const resolvedPanelDescription = panelDescription ?? t("auth.panel.default_description");
  const resolvedPanelImageAlt = panelImageAlt ?? t("auth.panel.default_alt");

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className={cn(
        "grid min-h-screen bg-background text-foreground outline-none lg:grid-cols-[1.05fr_1fr]",
        className,
      )}
    >
      <div className="relative hidden overflow-hidden border-r border-border/50 bg-muted/35 lg:block dark:bg-card/40">
        <Image
          src={panelImage}
          alt={resolvedPanelImageAlt}
          fill
          className="object-cover opacity-[0.14] dark:opacity-[0.2]"
          sizes="55vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/85 to-muted/60 dark:from-background dark:via-card/90 dark:to-muted/30" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        <div className="relative flex h-full flex-col justify-between p-12 xl:p-16">
          <BrandMark surface="theme" width={148} />

          <div className="max-w-md">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-medium tracking-[0.16em] text-amber-900 uppercase dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
              <Sparkles className="h-3 w-3 text-amber-600 dark:text-amber-400" aria-hidden />
              {t("auth.panel.secure_badge")}
            </div>
            <h2 className="mt-5 text-3xl font-semibold leading-tight text-foreground xl:text-4xl">
              {resolvedPanelTitle}
            </h2>
            {resolvedPanelDescription ? (
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                {resolvedPanelDescription}
              </p>
            ) : null}

            {panelHighlights?.length ? (
              <ul className="mt-8 space-y-3">
                {panelHighlights.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-foreground/90">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-500/25 dark:bg-amber-500/10">
                      <ShieldCheck
                        className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400"
                        aria-hidden
                      />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Unique Sky Way
          </p>
        </div>
      </div>

      <div className="relative flex flex-col bg-background">
        <div className="flex items-center justify-between gap-2 border-b border-border/50 px-3 py-3 sm:gap-3 sm:px-6 sm:py-5 lg:px-10">
          <div className="min-w-0 max-w-[6.5rem] shrink-0 sm:max-w-none lg:hidden">
            <BrandMark surface="theme" width={96} className="[&_img]:max-h-7" />
          </div>
          <AuthChromeControls />
        </div>

        <div className="flex flex-1 items-center justify-center px-6 pt-8 pb-10 lg:px-10">
          <div className="w-full max-w-[440px]">
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg shadow-slate-200/50 dark:shadow-black/25">
              <div className="h-1 w-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600" />
              <div className="p-8 sm:p-9">
                <div className="mb-8">
                  <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
                  {description ? (
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {description}
                    </p>
                  ) : null}
                </div>
                <div>{children}</div>
              </div>
            </div>

            {footer ? <div className="mt-6">{footer}</div> : null}
          </div>
        </div>
      </div>
    </main>
  );
}

export function AuthTrustBar() {
  const { t } = useI18n();

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <ShieldCheck className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" aria-hidden />
        {t("auth.trust.encryption")}
      </span>
      <span className="hidden h-3 w-px bg-border sm:block" />
      <span>{t("auth.trust.portal")}</span>
      <span className="hidden h-3 w-px bg-border sm:block" />
      <span>info@uniqueskyway.com</span>
    </div>
  );
}

export function AuthLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={authLinkClass}>
      {children}
    </Link>
  );
}

export const authLinkClass = "font-medium text-primary underline-offset-4 hover:underline";

export const authSubmitClass =
  "h-11 w-full border-0 bg-gradient-to-r from-amber-500 to-amber-600 text-sm font-semibold text-slate-950 shadow-md shadow-amber-500/15 hover:from-amber-400 hover:to-amber-500 hover:text-slate-950";
