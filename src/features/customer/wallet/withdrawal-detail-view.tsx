"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Button, Skeleton, StatusChip } from "@/components/ui";
import { CurrencyDisplay, DateDisplay } from "@/components/ui/display";
import { getCustomerJson } from "@/features/customer/api-client";
import { presentWithdrawalStatus } from "@/features/customer/wallet/status-presentation";
import type { TimelineStep, WalletWithdrawal } from "@/features/customer/wallet/types";

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
    return <Skeleton className="h-64 w-full rounded-xl" aria-label="Loading withdrawal" />;
  }

  if (error || !withdrawal) {
    return (
      <section className="rounded-xl border border-border/80 p-6">
        <h2 className="text-base font-semibold">Withdrawal unavailable</h2>
        <p className="mt-2 text-sm text-muted-foreground">{error ?? "Not found."}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/wallet/withdrawals">Back to withdrawal history</Link>
        </Button>
      </section>
    );
  }

  const status = presentWithdrawalStatus(withdrawal.status);
  const current = timeline.find((step) => step.current) ?? timeline[timeline.length - 1];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-3xl font-semibold">
            <CurrencyDisplay amountMinor={Number(withdrawal.amountMinor)} />
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Requested <DateDisplay value={withdrawal.createdAt} />
          </p>
        </div>
        <StatusChip tone={status.tone}>{status.label}</StatusChip>
      </div>

      <section className="grid gap-3 rounded-xl border border-border/80 p-5 sm:grid-cols-2">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Current status</h2>
          <p className="mt-1 text-sm text-muted-foreground">{status.explanation}</p>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">Expected next step</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {current?.nextExpectedStep ?? status.nextExpectedStep}
          </p>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">Expected timeline</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Review and payout can take longer than a payment. We show progress — not clock
            promises.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">Support path</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            If something looks wrong, contact support with this withdrawal id.
          </p>
          <Button asChild variant="outline" size="sm" className="mt-2">
            <Link href="/contact">Contact support</Link>
          </Button>
        </div>
      </section>

      {withdrawal.reviewReason ? (
        <section className="rounded-xl border border-border/80 p-5">
          <h2 className="text-base font-semibold">Review note</h2>
          <p className="mt-2 text-sm text-muted-foreground">{withdrawal.reviewReason}</p>
        </section>
      ) : null}

      <section className="rounded-xl border border-border/80 p-5">
        <h2 className="text-base font-semibold">Progress timeline</h2>
        <ol className="mt-4 space-y-3">
          {timeline.map((step) => (
            <li key={step.key} className="flex gap-3">
              <span
                className={
                  step.current
                    ? "mt-1 size-2.5 shrink-0 rounded-full bg-foreground"
                    : step.complete
                      ? "mt-1 size-2.5 shrink-0 rounded-full bg-foreground/40"
                      : "mt-1 size-2.5 shrink-0 rounded-full border border-border"
                }
                aria-hidden
              />
              <div>
                <p className="text-sm font-medium text-foreground">{step.label}</p>
                <p className="text-sm text-muted-foreground">{step.nextExpectedStep}</p>
                {step.at ? (
                  <p className="text-xs text-muted-foreground">
                    <DateDisplay value={step.at} />
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="ghost">
          <Link href="/wallet/withdrawals">Withdrawal history</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/wallet">Wallet</Link>
        </Button>
      </div>
    </div>
  );
}
