"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Button, Skeleton, StatusChip } from "@/components/ui";
import { DashboardPanelCard } from "@/components/ui/dashboard-panel-card";
import { CurrencyDisplay, DateDisplay } from "@/components/ui/display";
import { getCustomerJson, postCustomerJson } from "@/features/customer/api-client";
import { presentDepositStatus } from "@/features/customer/wallet/status-presentation";
import type { TimelineStep, WalletDeposit } from "@/features/customer/wallet/types";
import { cn } from "@/lib/utils";

/** WP2 — deposit detail presentation over certified deposit timeline. */
export function DepositDetailView({ depositId }: { depositId: string }) {
  const [deposit, setDeposit] = useState<WalletDeposit | null>(null);
  const [timeline, setTimeline] = useState<TimelineStep[]>([]);
  const [canCancel, setCanCancel] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    let active = true;
    void getCustomerJson<{
      deposit: WalletDeposit;
      timeline: TimelineStep[];
      canCancel: boolean;
    }>(`/api/customer/deposits/${depositId}`).then((result) => {
      if (!active) return;
      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }
      setDeposit(result.data?.deposit ?? null);
      setTimeline(result.data?.timeline ?? []);
      setCanCancel(Boolean(result.data?.canCancel));
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [depositId]);

  async function cancelDeposit() {
    setCancelling(true);
    const result = await postCustomerJson<{ depositIntent: WalletDeposit }>(
      `/api/customer/deposits/${depositId}/cancel`,
      {},
    );
    setCancelling(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.data?.depositIntent) {
      setDeposit(result.data.depositIntent);
      setCanCancel(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading deposit">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-56 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !deposit) {
    return (
      <section className="rounded-xl border border-border/80 bg-card p-6 shadow-sm">
        <h2 className="text-base font-semibold">Deposit unavailable</h2>
        <p className="mt-2 text-sm text-muted-foreground">{error ?? "Not found."}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/wallet/deposits">Back to deposits</Link>
        </Button>
      </section>
    );
  }

  const status = presentDepositStatus(deposit.status);

  return (
    <div className="space-y-6">
      <section
        className="relative overflow-hidden rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-7"
        aria-label="Deposit summary"
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,var(--primary)_0%,transparent_50%)] opacity-[0.12] dark:opacity-[0.2]"
          aria-hidden
        />
        <div className="relative flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Deposit amount
            </p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              <CurrencyDisplay
                amountMinor={Number(deposit.amountMinor)}
                currency={deposit.currency}
              />
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Created <DateDisplay value={deposit.createdAt} />
              {deposit.confirmedAt ? (
                <>
                  {" · "}
                  Confirmed <DateDisplay value={deposit.confirmedAt} />
                </>
              ) : null}
            </p>
            <p className="mt-1 text-sm capitalize text-muted-foreground">
              Provider: {deposit.provider.replaceAll("_", " ")}
            </p>
          </div>
          <StatusChip tone={status.tone}>{status.label}</StatusChip>
        </div>
      </section>

      <DashboardPanelCard title="Status explanation" accent="sky">
        <p className="text-sm text-muted-foreground">{status.explanation}</p>
        <p className="mt-3 text-sm text-foreground">
          <span className="font-medium">Expected next step: </span>
          {status.nextExpectedStep}
        </p>
      </DashboardPanelCard>

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
        {deposit.providerAuthorizationUrl &&
        (deposit.status === "created" || deposit.status === "pending") ? (
          <Button asChild>
            <a href={deposit.providerAuthorizationUrl}>Continue payment</a>
          </Button>
        ) : null}
        {canCancel ? (
          <Button
            type="button"
            variant="outline"
            disabled={cancelling}
            aria-busy={cancelling}
            onClick={() => void cancelDeposit()}
          >
            {cancelling ? "Cancelling…" : "Cancel deposit"}
          </Button>
        ) : null}
        <Button asChild variant="ghost">
          <Link href="/contact">Contact support</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/wallet/deposits">Deposits</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/wallet">Wallet</Link>
        </Button>
      </div>
    </div>
  );
}
