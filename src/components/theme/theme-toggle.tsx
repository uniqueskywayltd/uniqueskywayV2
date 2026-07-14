"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useSyncExternalStore } from "react";

import { Button } from "@/components/ui";
import { useI18n } from "@/features/i18n/i18n-provider";
import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  className?: string;
  compact?: boolean;
};

function useIsClient() {
  return useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
}

export function ThemeToggle({ className, compact = true }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { t } = useI18n();
  const mounted = useIsClient();
  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");
  const label = isDark ? t("theme.toggle.light") : t("theme.toggle.dark");

  useEffect(() => {
    if (!mounted) return;
    if (theme === "system" || theme == null) {
      setTheme(resolvedTheme === "dark" ? "dark" : "light");
    }
  }, [mounted, theme, resolvedTheme, setTheme]);

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
        setTheme(isDark ? "light" : "dark");
      }}
      aria-label={label}
      title={label}
    >
      {mounted ? (
        isDark ? (
          <Sun className="size-4 text-amber-500" aria-hidden />
        ) : (
          <Moon className="size-4" aria-hidden />
        )
      ) : (
        <span className="size-4" aria-hidden />
      )}
    </Button>
  );
}
