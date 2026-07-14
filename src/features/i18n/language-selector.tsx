"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { LANGUAGE_COOKIE_NAME, listSelectableLanguages, translate, type AppLanguage } from "@/i18n";
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
  initialLanguage?: AppLanguage;
  className?: string;
  compact?: boolean;
}

export function LanguageSelector({
  initialLanguage = "en",
  className,
  compact = true,
}: LanguageSelectorProps) {
  const router = useRouter();
  const labelId = useId();
  const [language, setLanguage] = useState<AppLanguage>(
    () => readCookieLanguage() ?? initialLanguage,
  );
  const [pending, setPending] = useState(false);
  const options = listSelectableLanguages();

  async function onChange(next: string) {
    const typed = next as AppLanguage;
    setPending(true);
    setLanguage(typed);

    const csrfToken = await getCsrfToken();
    if (!csrfToken) {
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

    setPending(false);
    if (!response.ok) return;
    router.refresh();
  }

  const label = translate(language, "language.selector.label");

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <Globe className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <span id={labelId} className="sr-only">
        {label}
      </span>
      <Select value={language} onValueChange={onChange} disabled={pending}>
        <SelectTrigger
          aria-labelledby={labelId}
          aria-label={translate(language, "language.selector.change")}
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
