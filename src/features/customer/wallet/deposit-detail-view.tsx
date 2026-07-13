"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Button, Skeleton, StatusChip } from "@/components/ui";
import { CurrencyDisplay, DateDisplay } from "@/components/ui/display";
import { getCustomerJson, postCustomerJson } from "@/features/customer/api-client";
import { presentDepositStatus } from "@/features/customer/wallet/status-presentation";
import type { TimelineStep, WalletDeposit } from "@/features/customer/wallet/types";

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
    return <Skeleton className="h-64 w-full rounded-xl" aria-label="Loading deposit" />;
  }

  if (error || !deposit) {
    return (
      <section className="rounded-xl border border-border/80 p-6">
        <h2 className="text-base font-semibold">Deposit unavailable</h2>
        <p className="mt-2 text-sm text-muted-foreground">{error ?? "Not found."}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/wallet/deposits">Back to funding history</Link>
        </Button>
      </section>
    );
  }

  const status = presentDepositStatus(deposit.status);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-3xl font-semibold">
            <CurrencyDisplay amountMinor={Number(deposit.amountMinor)} />
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Created <DateDisplay value={deposit.createdAt} />
          </p>
        </div>
        <StatusChip tone={status.tone}>{status.label}</StatusChip>
      </div>

      <section className="rounded-xl border border-border/80 p-5">
        <h2 className="text-base font-semibold">Status explanation</h2>
        <p className="mt-2 text-sm text-muted-foreground">{status.explanation}</p>
        <p className="mt-2 text-sm text-foreground">
          <span className="font-medium">Expected next step: </span>
          {status.nextExpectedStep}
        </p>
      </section>

      <section className="rounded-xl border border-border/80 p-5">
        <h2 className="text-base font-semibold">Timeline</h2>
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
            onClick={() => void cancelDeposit()}
          >
            {cancelling ? "Cancelling…" : "Cancel deposit"}
          </Button>
        ) : null}
        <Button asChild variant="ghost">
          <Link href="/contact">Support</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/wallet/deposits">Funding history</Link>
        </Button>
      </div>
    </div>
  );
}
