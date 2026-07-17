"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

/** Prominent invest CTA when wallet has funds and no active investments. */
export function DashboardInvestCta({ className }: { className?: string }) {
  return (
    <section
      aria-label="Start investing"
      className={cn(
        "relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/12 via-card to-card p-6 shadow-[var(--elevation-2)] sm:p-8",
        "motion-safe:transition-[box-shadow,transform,border-color] motion-safe:duration-300 motion-reduce:transition-none",
        "hover:border-primary/40 hover:shadow-[var(--elevation-3)] motion-safe:hover:-translate-y-0.5",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute -top-16 -right-10 h-44 w-44 rounded-full bg-primary/15 blur-3xl dark:bg-primary/25"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-20 -left-8 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl"
        aria-hidden
      />

      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl space-y-3">
          <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-primary uppercase">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Ready to invest
          </p>
          <h2 className="font-heading text-2xl leading-tight text-foreground sm:text-3xl">
            🚀 Start Growing Your Money
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            Your wallet has available funds ready to invest. Choose an investment plan and start
            earning returns immediately.
          </p>
        </div>

        <div className="flex flex-col gap-2.5 sm:min-w-[12.5rem]">
          <Button
            asChild
            size="lg"
            className={cn(
              "h-11 w-full gap-2 shadow-md",
              "motion-safe:transition-[transform,box-shadow] motion-safe:duration-200 motion-reduce:transition-none",
              "motion-safe:hover:scale-[1.02] motion-safe:hover:shadow-lg motion-safe:active:scale-[0.99]",
            )}
          >
            <Link href="/portfolio/activate">
              Start Investing
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
          <Button asChild variant="link" className="h-auto justify-center px-0 text-sm">
            <Link href="/plans">View Investment Plans</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
