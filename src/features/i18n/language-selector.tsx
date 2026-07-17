"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Globe, Languages } from "lucide-react";

import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/features/i18n/i18n-provider";
import { persistLanguageChoice } from "@/features/i18n/persist-language";
import { getLanguageEntry, listSelectableLanguages, type AppLanguage } from "@/i18n";
import { cn } from "@/lib/utils";

export interface LanguageSelectorProps {
  className?: string;
  compact?: boolean;
  /**
   * full — native names in a select (desktop).
   * icon — compact globe button + premium picker (mobile).
   * auto — icon below md, full from md up (default).
   */
  variant?: "auto" | "full" | "icon";
}

/** Premium language selector — native names; mobile uses a globe icon picker. */
export function LanguageSelector({
  className,
  compact = true,
  variant = "auto",
}: LanguageSelectorProps) {
  if (variant === "icon") {
    return <LanguageIconPicker {...(className ? { className } : {})} />;
  }
  if (variant === "full") {
    return <LanguageFullSelect {...(className ? { className } : {})} compact={compact} />;
  }

  return (
    <>
      <LanguageIconPicker
        {...(className ? { className: cn("md:hidden", className) } : { className: "md:hidden" })}
      />
      <LanguageFullSelect
        {...(className
          ? { className: cn("hidden md:flex", className) }
          : { className: "hidden md:flex" })}
        compact={compact}
      />
    </>
  );
}

function useLanguageChange() {
  const router = useRouter();
  const { language, setLanguage } = useI18n();
  const [pending, setPending] = useState(false);
  const [, startTransition] = useTransition();

  async function onChange(next: string) {
    const typed = next as AppLanguage;
    if (typed === language) return;

    setPending(true);
    setLanguage(typed);
    await persistLanguageChoice(typed);
    startTransition(() => {
      router.refresh();
    });
    setPending(false);
  }

  return { language, pending, onChange };
}

function LanguageFullSelect({ className, compact }: { className?: string; compact: boolean }) {
  const labelId = useId();
  const { t } = useI18n();
  const { language, pending, onChange } = useLanguageChange();
  const options = listSelectableLanguages();
  const current = getLanguageEntry(language);

  return (
    <div className={cn("flex shrink-0 items-center", className)}>
      <span id={labelId} className="sr-only">
        {t("language.selector.label")}
      </span>
      <Select value={language} onValueChange={onChange} disabled={pending}>
        <SelectTrigger
          aria-labelledby={labelId}
          aria-label={t("language.selector.change", { language: current.nativeName })}
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

function LanguageIconPicker({ className }: { className?: string }) {
  const { t } = useI18n();
  const { language, pending, onChange } = useLanguageChange();
  const options = listSelectableLanguages();
  const current = getLanguageEntry(language);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={pending}
          className={cn(
            "size-11 shrink-0 text-muted-foreground hover:text-foreground md:size-9",
            className,
          )}
          aria-label={t("language.selector.change", { language: current.nativeName })}
          title={t("language.selector.current", { language: current.nativeName })}
        >
          <Globe className="size-4" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="z-[var(--z-dropdown)] min-w-[12.5rem] p-1.5"
        aria-label={t("language.selector.label")}
      >
        <DropdownMenuLabel className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
          {t("language.selector.label")}
        </DropdownMenuLabel>
        {options.map((option) => {
          const active = option.code === language;
          return (
            <DropdownMenuItem
              key={option.code}
              disabled={pending}
              className={cn(
                "cursor-pointer gap-3 rounded-md px-2.5 py-2.5 text-sm font-medium",
                active && "bg-accent/70",
              )}
              onSelect={() => {
                void onChange(option.code);
              }}
              aria-current={active ? "true" : undefined}
            >
              <span
                className="min-w-0 flex-1 truncate"
                dir={option.direction === "rtl" ? "rtl" : "ltr"}
              >
                {option.nativeName}
              </span>
              <Check
                className={cn(
                  "size-4 shrink-0 text-primary transition-opacity",
                  active ? "opacity-100" : "opacity-0",
                )}
                aria-hidden
              />
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
