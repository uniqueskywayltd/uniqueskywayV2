import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type WithdrawalSurfaceHeroProps = {
  title: string;
  description: string;
  showNewWithdrawal?: boolean;
  className?: string;
};

export function WithdrawalSurfaceHero({
  title,
  description,
  showNewWithdrawal = false,
  className,
}: WithdrawalSurfaceHeroProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm",
        className,
      )}
      aria-label="Withdrawal header"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,var(--primary)_0%,transparent_45%),linear-gradient(225deg,rgba(244,63,94,0.12)_0%,transparent_55%)] opacity-[0.2] dark:opacity-[0.32]"
        aria-hidden
      />

      <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-7 md:p-8">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/10 text-rose-700 ring-1 ring-rose-500/20 dark:text-rose-400">
            <ArrowUpRight className="h-5 w-5" aria-hidden />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
        </div>
        {showNewWithdrawal ? (
          <Link
            href="/wallet/withdrawals/new"
            className={cn(buttonVariants(), "shrink-0 focus-visible:ring-offset-2")}
          >
            New withdrawal
          </Link>
        ) : null}
      </div>

      <div
        className="h-1 w-full bg-gradient-to-r from-transparent via-rose-500/70 to-transparent"
        aria-hidden
      />
    </section>
  );
}
