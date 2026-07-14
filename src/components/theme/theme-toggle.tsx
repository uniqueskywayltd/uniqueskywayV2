"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui";
import { useI18n } from "@/features/i18n/i18n-provider";
import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  className?: string;
  compact?: boolean;
};

const THEME_ORDER = ["system", "light", "dark"] as const;
type AppTheme = (typeof THEME_ORDER)[number];

function useIsClient() {
  return useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
}

function nextTheme(current: string | undefined): AppTheme {
  const index = THEME_ORDER.indexOf((current as AppTheme) || "system");
  return THEME_ORDER[(index + 1) % THEME_ORDER.length] ?? "system";
}

export function ThemeToggle({ className, compact = true }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const { t } = useI18n();
  const mounted = useIsClient();
  const current = (mounted ? theme : "system") as AppTheme | undefined;
  const labelKey =
    current === "light"
      ? "theme.toggle.dark"
      : current === "dark"
        ? "theme.toggle.system"
        : "theme.toggle.light";
  const label = t(labelKey);

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        "size-9 shrink-0 text-muted-foreground hover:text-foreground",
        compact && "border-0 shadow-none",
        className,
      )}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setTheme(nextTheme(theme));
      }}
      aria-label={label}
      title={`${t("theme.cycle")}: ${current === "system" ? "System" : current === "light" ? "Light" : "Dark"}`}
    >
      {mounted ? (
        current === "dark" ? (
          <Sun className="size-4 text-amber-500" aria-hidden />
        ) : current === "light" ? (
          <Moon className="size-4" aria-hidden />
        ) : (
          <Monitor className="size-4" aria-hidden />
        )
      ) : (
        <span className="size-4" aria-hidden />
      )}
    </Button>
  );
}
