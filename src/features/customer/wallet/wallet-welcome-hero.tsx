"use client";

import { Wallet } from "lucide-react";

import { useI18n } from "@/features/i18n/i18n-provider";
import { cn } from "@/lib/utils";

type WalletWelcomeHeroProps = {
  className?: string;
};

export function WalletWelcomeHero({ className }: WalletWelcomeHeroProps) {
  const { t } = useI18n();

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm",
        className,
      )}
      aria-label={t("wallet.wallet_header_aria")}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,var(--primary)_0%,transparent_45%),linear-gradient(225deg,rgba(16,185,129,0.14)_0%,transparent_55%)] opacity-[0.2] dark:opacity-[0.32]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.5),transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.06),transparent_55%)]"
        aria-hidden
      />

      <div className="relative flex items-start gap-4 p-5 sm:gap-5 sm:p-7 md:p-8">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-400 sm:h-14 sm:w-14">
          <Wallet className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium tracking-wide text-primary/80 sm:text-sm">
            {t("wallet.investor_portal")}
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:mt-2.5 sm:text-3xl">
            {t("wallet.title")}
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground sm:mt-2">
            {t("wallet.welcome_description")}
          </p>
        </div>
      </div>

      <div
        className="h-1 w-full bg-gradient-to-r from-transparent via-emerald-500/70 to-transparent"
        aria-hidden
      />
    </section>
  );
}
