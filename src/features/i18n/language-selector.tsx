"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { useI18n } from "@/features/i18n/i18n-provider";
import {
  getLanguageDirection,
  LANGUAGE_COOKIE_NAME,
  listSelectableLanguages,
  type AppLanguage,
} from "@/i18n";
import { cn } from "@/lib/utils";

const SHORT_LABEL: Record<AppLanguage, string> = {
  en: "EN",
  es: "ES",
  fr: "FR",
  ar: "AR",
  pt: "PT",
  hi: "HI",
  bn: "BN",
  "zh-Hans": "ZH",
  ru: "RU",
  ja: "JA",
};

async function getCsrfToken(): Promise<string | null> {
  try {
    const response = await fetch("/api/auth/csrf", { credentials: "include" });
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

export function LanguageSelector({ className, compact = true }: LanguageSelectorProps) {
  const router = useRouter();
  const labelId = useId();
  const { language, setLanguage, t } = useI18n();
  const [pending, setPending] = useState(false);
  const [, startTransition] = useTransition();
  const options = listSelectableLanguages();

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
        await fetch("/api/locale", {
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
              ? "h-9 w-[4.25rem] shrink-0 justify-center gap-1 border-border/60 bg-background/80 px-2 text-xs font-semibold tracking-wide shadow-none"
              : "w-full",
          )}
        >
          <SelectValue placeholder={SHORT_LABEL[language]}>
            {SHORT_LABEL[language] ?? language.toUpperCase()}
          </SelectValue>
        </SelectTrigger>
        <SelectContent align="end" className="z-[var(--z-dropdown)] min-w-[10rem]">
          {options.map((option) => (
            <SelectItem key={option.code} value={option.code}>
              <span className="inline-flex w-full items-center justify-between gap-3">
                <span>{option.nativeName}</span>
                <span className="text-xs font-medium text-muted-foreground">
                  {SHORT_LABEL[option.code]}
                </span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
