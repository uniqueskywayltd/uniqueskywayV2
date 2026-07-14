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
import { LANGUAGE_COOKIE_NAME, listSelectableLanguages, type AppLanguage } from "@/i18n";
import { cn } from "@/lib/utils";

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
    const previous = language;
    setPending(true);
    setLanguage(typed);

    try {
      const csrfToken = await getCsrfToken();
      if (!csrfToken) {
        setLanguage(previous);
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
        setPending(false);
        return;
      }

      // Soft refresh server trees (lang/dir). Theme stays client-side via next-themes.
      startTransition(() => {
        router.refresh();
      });
    } catch {
      setLanguage(previous);
    } finally {
      setPending(false);
    }
  }

  // Prefer cookie if provider lagged after refresh (guest).
  const value = readCookieLanguage() ?? language;

  return (
    <div className={cn("flex items-center", className)}>
      <span id={labelId} className="sr-only">
        {t("language.selector.label")}
      </span>
      <Select value={value} onValueChange={onChange} disabled={pending}>
        <SelectTrigger
          aria-labelledby={labelId}
          aria-label={t("language.selector.change")}
          className={cn(
            compact
              ? "h-9 w-auto min-w-[7.5rem] border-transparent bg-transparent px-2 shadow-none"
              : "w-full",
          )}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.code} value={option.code}>
              {option.nativeName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
