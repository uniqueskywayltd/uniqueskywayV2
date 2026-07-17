"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Globe, X } from "lucide-react";

import { Button } from "@/components/ui";
import { useI18n } from "@/features/i18n/i18n-provider";
import {
  dismissLanguageSuggestionForSession,
  hasExplicitLanguagePreference,
  isLanguageSuggestionDismissed,
  persistLanguageChoice,
} from "@/features/i18n/persist-language";
import { firstSupportedFromAcceptLanguage, getLanguageEntry, type AppLanguage } from "@/i18n";
import { cn } from "@/lib/utils";

function useIsClient() {
  return useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
}

function detectBrowserLanguage(): AppLanguage | null {
  if (typeof navigator === "undefined") return null;
  const browserTag = navigator.languages?.[0] || navigator.language || null;
  return firstSupportedFromAcceptLanguage(browserTag);
}

/**
 * First-visit browser language suggestion — never auto-switches.
 * Shown only when no saved preference exists and the browser language
 * differs from the current site language.
 */
export function LanguageSuggestionBanner() {
  const router = useRouter();
  const pathname = usePathname();
  const { language, setLanguage, t } = useI18n();
  const mounted = useIsClient();
  const [sessionDismissed, setSessionDismissed] = useState(false);
  const [pending, startTransition] = useTransition();

  const suggested =
    !mounted ||
    pathname.startsWith("/admin") ||
    sessionDismissed ||
    isLanguageSuggestionDismissed() ||
    hasExplicitLanguagePreference()
      ? null
      : (() => {
          const detected = detectBrowserLanguage();
          if (!detected || detected === language) return null;
          return detected;
        })();

  if (!suggested) return null;

  const targetLanguage = suggested;
  const nativeName = getLanguageEntry(targetLanguage).nativeName;

  function closeWithoutSwitching() {
    dismissLanguageSuggestionForSession();
    setSessionDismissed(true);
  }

  function switchLanguage() {
    setLanguage(targetLanguage);
    startTransition(() => {
      void persistLanguageChoice(targetLanguage).then(() => {
        dismissLanguageSuggestionForSession();
        setSessionDismissed(true);
        router.refresh();
      });
    });
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-0 z-[var(--z-toast)] flex justify-center p-3 sm:p-4",
        "pb-[max(0.75rem,env(safe-area-inset-bottom))]",
      )}
    >
      <div
        className={cn(
          "pointer-events-auto flex w-full max-w-lg flex-col gap-3 rounded-2xl border border-border/70",
          "bg-card/95 p-4 text-card-foreground shadow-[var(--elevation-3)] backdrop-blur-md",
          "sm:flex-row sm:items-center sm:gap-4",
        )}
      >
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Globe className="size-4" aria-hidden />
          </span>
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-medium text-foreground">
              {t("language.suggest.noticed", { language: nativeName })}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("language.suggest.switch_prompt", { language: nativeName })}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:ps-1">
          <Button
            type="button"
            size="sm"
            disabled={pending}
            onClick={switchLanguage}
            className="min-h-10 flex-1 sm:flex-none"
          >
            {t("language.suggest.switch")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={closeWithoutSwitching}
            className="min-h-10 flex-1 sm:flex-none"
          >
            {t("language.suggest.not_now")}
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            disabled={pending}
            onClick={closeWithoutSwitching}
            className="size-10 shrink-0"
            aria-label={t("language.suggest.dismiss")}
          >
            <X className="size-4" aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  );
}
