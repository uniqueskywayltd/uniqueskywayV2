"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Home } from "lucide-react";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { LanguageSelector } from "@/features/i18n/language-selector";
import { useI18n } from "@/features/i18n/i18n-provider";
import { cn } from "@/lib/utils";

export function AuthChromeControls({ homeLink = true }: { homeLink?: boolean }) {
  const { t } = useI18n();

  return (
    <div className="ms-auto flex shrink-0 items-center gap-0.5 sm:gap-1.5">
      <ThemeToggle compact className="size-11 sm:size-9" />
      <LanguageSelector />
      {homeLink ? (
        <Link
          href="/"
          className={cn(
            "inline-flex h-11 items-center justify-center gap-1.5 rounded-lg px-2 text-sm font-medium text-foreground sm:h-9",
            "transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
          aria-label={t("chrome.back_home")}
        >
          <Home className="size-4 shrink-0" aria-hidden />
          <span className="hidden max-w-[6.5rem] truncate text-sm sm:inline sm:max-w-none">
            {t("chrome.back_home")}
          </span>
        </Link>
      ) : null}
    </div>
  );
}

export function AuthTranslatedText({
  messageKey,
  values,
}: {
  messageKey: string;
  values?: Record<string, string | number>;
}) {
  const { t } = useI18n();
  return <>{t(messageKey, values)}</>;
}

export function AuthFooterCopy({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
