"use client";

import Link from "next/link";
import { ArrowDownLeft } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { useI18n } from "@/features/i18n/i18n-provider";
import type { MessageKey } from "@/i18n/messages/en";
import { cn } from "@/lib/utils";

type DepositSurfaceHeroProps = {
  titleKey: MessageKey;
  descriptionKey: MessageKey;
  showNewDeposit?: boolean;
  className?: string;
};

export function DepositSurfaceHero({
  titleKey,
  descriptionKey,
  showNewDeposit = false,
  className,
}: DepositSurfaceHeroProps) {
  const { t } = useI18n();

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm",
        className,
      )}
      aria-label={t("wallet.deposit_header_aria")}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,var(--primary)_0%,transparent_45%),linear-gradient(225deg,rgba(14,165,233,0.14)_0%,transparent_55%)] opacity-[0.2] dark:opacity-[0.32]"
        aria-hidden
      />

      <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-7 md:p-8">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500/10 text-sky-700 ring-1 ring-sky-500/20 dark:text-sky-400">
            <ArrowDownLeft className="h-5 w-5" aria-hidden />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t(titleKey)}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{t(descriptionKey)}</p>
        </div>
        {showNewDeposit ? (
          <Link
            href="/wallet/deposits/new"
            className={cn(buttonVariants(), "shrink-0 focus-visible:ring-offset-2")}
          >
            {t("wallet.new_deposit")}
          </Link>
        ) : null}
      </div>

      <div
        className="h-1 w-full bg-gradient-to-r from-transparent via-sky-500/70 to-transparent"
        aria-hidden
      />
    </section>
  );
}
