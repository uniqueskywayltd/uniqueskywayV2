"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Languages } from "lucide-react";

import { Button } from "@/components/ui";
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
  /** Wider trigger for settings/preferences surfaces. */
  expanded?: boolean;
}

/**
 * Responsive language selector — always shows text (never icon-only).
 * Small screens: EN / AR / ES / FR. sm+: full native names in the trigger.
 * Picker always lists native names with a checkmark on the active language.
 */
export function LanguageSelector({ className, expanded = false }: LanguageSelectorProps) {
  const labelId = useId();
  const router = useRouter();
  const { t, language, setLanguage } = useI18n();
  const [pending, setPending] = useState(false);
  const [, startTransition] = useTransition();
  const options = listSelectableLanguages();
  const current = getLanguageEntry(language);

  async function onChange(next: AppLanguage) {
    if (next === language) return;

    setPending(true);
    setLanguage(next);
    await persistLanguageChoice(next);
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            aria-labelledby={labelId}
            aria-label={t("language.selector.change", { language: current.nativeName })}
            title={t("language.selector.current", { language: current.nativeName })}
            className={cn(
              "h-9 shrink-0 gap-1 border-border/60 bg-background/80 px-2 font-medium shadow-none",
              "hover:bg-muted/60 sm:gap-1.5 sm:px-2.5",
              expanded
                ? "h-10 w-full min-w-[12rem] justify-between"
                : "min-w-[3.25rem] justify-center sm:min-w-[8.5rem] sm:justify-between",
            )}
          >
            <span className="inline-flex min-w-0 items-center gap-1 sm:gap-1.5">
              <Languages
                className="size-3.5 shrink-0 text-muted-foreground sm:size-3.5"
                aria-hidden
              />
              <span
                className="truncate text-xs font-semibold tracking-wide sm:hidden"
                dir={current.direction === "rtl" ? "rtl" : "ltr"}
              >
                {current.shortLabel}
              </span>
              <span
                className="hidden truncate text-sm sm:inline"
                dir={current.direction === "rtl" ? "rtl" : "ltr"}
              >
                {current.nativeName}
              </span>
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="z-[calc(var(--z-modal)+10)] min-w-[12.5rem] p-1.5"
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
    </div>
  );
}
