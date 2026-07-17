"use client";

import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { brandAssets } from "@/features/brand";
import { useI18n } from "@/features/i18n/i18n-provider";
import { getTimeGreetingKey } from "@/lib/utils/time-greeting";
import { cn } from "@/lib/utils";

type DashboardWelcomeHeroProps = {
  fullName: string;
  handle: string;
  avatarUrl: string | null;
  className?: string;
};

export function DashboardWelcomeHero({
  fullName,
  handle,
  avatarUrl,
  className,
}: DashboardWelcomeHeroProps) {
  const { t } = useI18n();
  const initials = fullName
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm",
        className,
      )}
      aria-label={t("dashboard.welcome_aria")}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,var(--primary)_0%,transparent_42%),linear-gradient(225deg,rgba(245,158,11,0.14)_0%,transparent_55%)] opacity-[0.22] dark:opacity-[0.35]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.55),transparent_50%)] dark:bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.06),transparent_55%)]"
        aria-hidden
      />

      <div className="relative flex items-center gap-5 p-5 sm:gap-6 sm:p-7 md:p-8">
        <div className="relative shrink-0 self-center">
          <div
            className="pointer-events-none absolute -inset-1 rounded-2xl bg-gradient-to-br from-primary/30 via-amber-500/20 to-transparent blur-sm"
            aria-hidden
          />
          <Link
            href="/account/profile"
            className="relative block rounded-2xl ring-1 ring-border/80 ring-offset-2 ring-offset-card motion-safe:transition-shadow motion-safe:duration-200 hover:ring-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label={t("dashboard.open_profile")}
          >
            <Avatar className="h-16 w-16 rounded-2xl sm:h-[4.5rem] sm:w-[4.5rem]">
              <AvatarImage src={avatarUrl ?? brandAssets.icon} alt="" />
              <AvatarFallback className="rounded-2xl bg-primary/10 text-base font-semibold text-primary">
                {initials || "US"}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>

        <div className="min-w-0 flex-1 py-0.5">
          <p className="text-xs font-medium tracking-wide text-primary/80 sm:text-sm">
            {t(getTimeGreetingKey())}
          </p>
          <h1 className="mt-2 truncate text-2xl font-bold tracking-tight text-foreground sm:mt-2.5 sm:text-3xl">
            {fullName}
          </h1>
          <p className="mt-1 truncate text-sm text-muted-foreground sm:mt-1.5">@{handle}</p>
        </div>
      </div>

      <div
        className="h-1 w-full bg-gradient-to-r from-transparent via-amber-500/80 to-transparent"
        aria-hidden
      />
    </section>
  );
}
