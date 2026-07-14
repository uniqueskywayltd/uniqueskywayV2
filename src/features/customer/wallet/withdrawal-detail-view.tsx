"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Button, Skeleton, StatusChip } from "@/components/ui";
import { DashboardPanelCard } from "@/components/ui/dashboard-panel-card";
import { CurrencyDisplay, DateDisplay } from "@/components/ui/display";
import { getCustomerJson } from "@/features/customer/api-client";
import { presentWithdrawalStatus } from "@/features/customer/wallet/status-presentation";
import type { TimelineStep, WalletWithdrawal } from "@/features/customer/wallet/types";
import { cn } from "@/lib/utils";

function customerActionGuidance(status: string): string {
  switch (status) {
    case "rejected":
    case "failed":
      return "Yes — read any review note, then contact support or start a new request if appropriate.";
    case "paid":
      return "Optional — confirm receipt at your destination.";
    case "cancelled":
      return "No — you can start a new withdrawal when you’re ready.";
    default:
      return "No — wait for the next certified status update. You do not need to do anything right now.";
  }
}

/** WP3 — withdrawal detail: clarity over density, certified fields only. */
export function WithdrawalDetailView({ withdrawalId }: { withdrawalId: string }) {
  const [withdrawal, setWithdrawal] = useState<WalletWithdrawal | null>(null);
  const [timeline, setTimeline] = useState<TimelineStep[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void getCustomerJson<{
      withdrawal: WalletWithdrawal;
      timeline: TimelineStep[];
    }>(`/api/customer/withdrawals/${withdrawalId}`).then((result) => {
      if (!active) return;
      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }
      setWithdrawal(result.data?.withdrawal ?? null);
      setTimeline(result.data?.timeline ?? []);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [withdrawalId]);

  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading withdrawal">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-56 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !withdrawal) {
    return (
      <section className="rounded-xl border border-border/80 bg-card p-6 shadow-sm">
        <h2 className="text-base font-semibold">Withdrawal unavailable</h2>
        <p className="mt-2 text-sm text-muted-foreground">{error ?? "Not found."}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/wallet/withdrawals">Back to withdrawals</Link>
        </Button>
      </section>
    );
  }

  const status = presentWithdrawalStatus(withdrawal.status);
  const current = timeline.find((step) => step.current) ?? timeline[timeline.length - 1];
  const nextStep = current?.nextExpectedStep ?? status.nextExpectedStep;

  return (
    <div className="space-y-6">
      <section
        className="relative overflow-hidden rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-7"
        aria-label="Withdrawal summary"
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,var(--primary)_0%,transparent_50%)] opacity-[0.12] dark:opacity-[0.2]"
          aria-hidden
        />
        <div className="relative flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Withdrawal amount
            </p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              <CurrencyDisplay
                amountMinor={Number(withdrawal.amountMinor)}
                currency={withdrawal.currency}
              />
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Requested <DateDisplay value={withdrawal.createdAt} />
              {withdrawal.paidAt ? (
                <>
                  {" · "}
                  Paid <DateDisplay value={withdrawal.paidAt} />
                </>
              ) : null}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              <span className="capitalize">
                {withdrawal.destinationType.replaceAll("_", " ")}
              </span>
              {" · "}
              <span className="font-mono text-xs">{withdrawal.destinationReference}</span>
            </p>
          </div>
          <StatusChip tone={status.tone}>{status.label}</StatusChip>
        </div>
      </section>

      <section
        className="grid gap-4 sm:grid-cols-3"
        aria-label="Withdrawal clarity"
      >
        <DashboardPanelCard title="What is happening?" accent="rose">
          <p className="text-sm font-medium text-foreground">{status.label}</p>
          <p className="mt-2 text-sm text-muted-foreground">{status.explanation}</p>
        </DashboardPanelCard>
        <DashboardPanelCard title="What happens next?" accent="amber">
          <p className="text-sm text-muted-foreground">{nextStep}</p>
          <p className="mt-3 text-xs text-muted-foreground">
            Progress is shown from certified status updates — not clock promises or bank ETAs.
          </p>
        </DashboardPanelCard>
        <DashboardPanelCard title="Do I need to do anything?" accent="sky">
          <p className="text-sm text-muted-foreground">
            {customerActionGuidance(withdrawal.status)}
          </p>
        </DashboardPanelCard>
      </section>

      {withdrawal.reviewReason ? (
        <DashboardPanelCard title="Review note" accent="primary">
          <p className="text-sm text-muted-foreground">{withdrawal.reviewReason}</p>
        </DashboardPanelCard>
      ) : null}

      <DashboardPanelCard title="Timeline" accent="primary">
        <ol className="space-y-4">
          {timeline.map((step) => (
            <li key={step.key} className="flex gap-3">
              <span
                className={cn(
                  "mt-1.5 size-2.5 shrink-0 rounded-full",
                  step.current
                    ? "bg-primary ring-4 ring-primary/20"
                    : step.complete
                      ? "bg-foreground/45"
                      : "border border-border bg-transparent",
                )}
                aria-hidden
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{step.label}</p>
                <p className="text-sm text-muted-foreground">{step.nextExpectedStep}</p>
                {step.at ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    <DateDisplay value={step.at} />
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </DashboardPanelCard>

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link href="/contact">Contact support</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/wallet/withdrawals">Withdrawals</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/wallet">Wallet</Link>
        </Button>
      </div>
    </div>
  );
}
