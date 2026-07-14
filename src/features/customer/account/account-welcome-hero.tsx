import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type AccountWelcomeHeroProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  accentClassName?: string;
  barClassName?: string;
  ariaLabel: string;
  className?: string;
};

/** Shared hero for Profile & Security — answers “What do I control about my account?” */
export function AccountWelcomeHero({
  title,
  description,
  icon: Icon,
  accentClassName = "bg-sky-500/10 text-sky-700 ring-sky-500/20 dark:text-sky-400",
  barClassName = "via-sky-500/70",
  ariaLabel,
  className,
}: AccountWelcomeHeroProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm",
        className,
      )}
      aria-label={ariaLabel}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,var(--primary)_0%,transparent_45%),linear-gradient(225deg,rgba(14,165,233,0.14)_0%,transparent_55%)] opacity-[0.2] dark:opacity-[0.32]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.5),transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.06),transparent_55%)]"
        aria-hidden
      />

      <div className="relative flex items-start gap-4 p-5 sm:gap-5 sm:p-7 md:p-8">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 sm:h-14 sm:w-14",
            accentClassName,
          )}
        >
          <Icon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium tracking-wide text-primary/80 sm:text-sm">
            Investor portal
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:mt-2.5 sm:text-3xl">
            {title}
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground sm:mt-2">{description}</p>
        </div>
      </div>

      <div
        className={cn(
          "h-1 w-full bg-gradient-to-r from-transparent to-transparent",
          barClassName,
        )}
        aria-hidden
      />
    </section>
  );
}
