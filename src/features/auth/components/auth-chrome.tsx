"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { LanguageSelector } from "@/features/i18n/language-selector";
import { useI18n } from "@/features/i18n/i18n-provider";

export function AuthChromeControls({ homeLink = true }: { homeLink?: boolean }) {
  const { t } = useI18n();

  return (
    <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
      <ThemeToggle compact />
      <LanguageSelector compact />
      {homeLink ? (
        <Link
          href="/"
          className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline"
        >
          {t("chrome.back_home")}
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
