"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Languages } from "lucide-react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui";
import { useI18n } from "@/features/i18n/i18n-provider";
import {
  getLanguageDirection,
  getLanguageEntry,
  LANGUAGE_COOKIE_NAME,
  listSelectableLanguages,
  type AppLanguage,
} from "@/i18n";
import { appPath } from "@/lib/app-path";
import { cn } from "@/lib/utils";

async function getCsrfToken(): Promise<string | null> {
  try {
    const response = await fetch(appPath("/api/auth/csrf"), { credentials: "include" });
    if (!response.ok) return null;
    const payload = (await response.json()) as { data?: { csrfToken?: string } };
    return payload.data?.csrfToken ?? null;
  } catch {
    return null;
  }
}

function writeCookieLanguage(language: AppLanguage) {
  const maxAge = 60 * 60 * 24 * 365;
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${LANGUAGE_COOKIE_NAME}=${encodeURIComponent(language)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

function applyDocumentLanguage(language: AppLanguage) {
  document.documentElement.lang = language;
  document.documentElement.dir = getLanguageDirection(language);
}

export interface LanguageSelectorProps {
  className?: string;
  compact?: boolean;
}

/** Premium language selector — native language names only (no EN/ES abbreviations). */
export function LanguageSelector({ className, compact = true }: LanguageSelectorProps) {
  const router = useRouter();
  const labelId = useId();
  const { language, setLanguage, t } = useI18n();
  const [pending, setPending] = useState(false);
  const [, startTransition] = useTransition();
  const options = listSelectableLanguages();
  const current = getLanguageEntry(language);

  async function onChange(next: string) {
    const typed = next as AppLanguage;
    if (typed === language) return;

    setPending(true);
    setLanguage(typed);
    writeCookieLanguage(typed);
    applyDocumentLanguage(typed);

    try {
      const csrfToken = await getCsrfToken();
      if (csrfToken) {
        await fetch(appPath("/api/locale"), {
          method: "POST",
          credentials: "include",
          headers: {
            "content-type": "application/json",
            "x-csrf-token": csrfToken,
          },
          body: JSON.stringify({ language: typed }),
        });
      }
    } catch {
      // Cookie + in-memory language already applied.
    }

    startTransition(() => {
      router.refresh();
    });
    setPending(false);
  }

  return (
    <div className={cn("flex shrink-0 items-center", className)}>
      <span id={labelId} className="sr-only">
        {t("language.selector.label")}
      </span>
      <Select value={language} onValueChange={onChange} disabled={pending}>
        <SelectTrigger
          aria-labelledby={labelId}
          aria-label={t("language.selector.change")}
          className={cn(
            compact
              ? "h-9 min-w-[8.5rem] shrink-0 justify-between gap-2 border-border/60 bg-background/80 px-2.5 text-sm font-medium shadow-none"
              : "h-10 w-full min-w-[12rem]",
          )}
        >
          <span className="inline-flex min-w-0 items-center gap-2">
            <Languages className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
            <SelectValue placeholder={current.nativeName}>
              <span className="truncate" dir={current.direction === "rtl" ? "rtl" : "ltr"}>
                {current.nativeName}
              </span>
            </SelectValue>
          </span>
        </SelectTrigger>
        <SelectContent align="end" className="z-[var(--z-dropdown)] min-w-[12rem]">
          {options.map((option) => (
            <SelectItem key={option.code} value={option.code}>
              <span
                className="inline-flex w-full items-center font-medium"
                dir={option.direction === "rtl" ? "rtl" : "ltr"}
              >
                {option.nativeName}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
