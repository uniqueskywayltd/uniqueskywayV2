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
  const response = await fetch("/api/auth/csrf", { credentials: "include" });
  if (!response.ok) return null;
  const payload = (await response.json()) as { data?: { csrfToken?: string } };
  return payload.data?.csrfToken ?? null;
}

function readCookieLanguage(): AppLanguage | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${LANGUAGE_COOKIE_NAME}=`));
  const value = match?.split("=")[1];
  const decoded = value ? decodeURIComponent(value) : null;
  const catalog = listSelectableLanguages();
  return catalog.some((entry) => entry.code === decoded) ? (decoded as AppLanguage) : null;
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
  const value = readCookieLanguage() ?? language;

  async function onChange(next: string) {
    const typed = next as AppLanguage;
    const previous = language;
    if (typed === value) return;

    setPending(true);
    setLanguage(typed);
    applyDocumentLanguage(typed);

    try {
      const csrfToken = await getCsrfToken();
      if (!csrfToken) {
        setLanguage(previous);
        applyDocumentLanguage(previous);
        setPending(false);
        return;
      }

      const response = await fetch("/api/locale", {
        method: "POST",
        credentials: "include",
        headers: {
          "content-type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({ language: typed }),
      });

      if (!response.ok) {
        setLanguage(previous);
        applyDocumentLanguage(previous);
        setPending(false);
        return;
      }

      startTransition(() => {
        router.refresh();
      });
    } catch {
      setLanguage(previous);
      applyDocumentLanguage(previous);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={cn("flex shrink-0 items-center", className)}>
      <span id={labelId} className="sr-only">
        {t("language.selector.label")}
      </span>
      <Select value={value} onValueChange={onChange} disabled={pending}>
        <SelectTrigger
          aria-labelledby={labelId}
          aria-label={t("language.selector.change")}
          className={cn(
            compact
              ? "h-9 w-[3.75rem] shrink-0 justify-center gap-1 border-transparent bg-transparent px-1.5 text-xs font-semibold tracking-wide shadow-none"
              : "w-full",
          )}
        >
          <SelectValue placeholder={SHORT_LABEL[value]}>
            {SHORT_LABEL[value] ?? value.toUpperCase()}
          </SelectValue>
        </SelectTrigger>
        <SelectContent align="end" className="min-w-[10rem]">
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
