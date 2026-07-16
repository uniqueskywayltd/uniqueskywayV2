"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Button, Skeleton, StatusChip } from "@/components/ui";
import { DashboardPanelCard } from "@/components/ui/dashboard-panel-card";
import { CurrencyDisplay, DateDisplay } from "@/components/ui/display";
import { getCustomerJson } from "@/features/customer/api-client";
import { presentWithdrawalStatus } from "@/features/customer/wallet/status-presentation";
import type { TimelineStep, WalletWithdrawal } from "@/features/customer/wallet/types";
import {
  parseWithdrawalDestination,
  shortenWalletAddress,
  type ParsedWithdrawalDestination,
} from "@/lib/withdrawal-destination";
import { cn } from "@/lib/utils";

/** Plain-English withdrawal detail — never renders destination JSON. */
export function WithdrawalDetailView({ withdrawalId }: { withdrawalId: string }) {
  const [withdrawal, setWithdrawal] = useState<WalletWithdrawal | null>(null);
  const [timeline, setTimeline] = useState<TimelineStep[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFullAddress, setShowFullAddress] = useState(false);
  const [copied, setCopied] = useState(false);

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
  const destination = parseWithdrawalDestination(
    withdrawal.destinationType,
    withdrawal.destinationReference,
  );
  const reference =
    withdrawal.providerPayoutReference?.trim() ||
    `USWWTH-${withdrawal.id.replaceAll("-", "").slice(0, 8).toUpperCase()}`;

  async function copyAddress(address: string) {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Withdrawal Details
        </h1>
        <div className="mt-3">
          <StatusChip tone={status.tone}>
            {statusEmoji(withdrawal.status)} {status.label}
          </StatusChip>
        </div>
      </div>

      <DashboardPanelCard title="Withdrawal Summary" accent="rose">
        <dl className="space-y-3 text-sm">
          <DetailRow label="Amount">
            <span className="text-base font-semibold tabular-nums">
              <CurrencyDisplay
                amountMinor={Number(withdrawal.amountMinor)}
                currency={withdrawal.currency}
              />
            </span>
          </DetailRow>
          <DestinationRows
            destination={destination}
            showFullAddress={showFullAddress}
            onToggleFull={() => setShowFullAddress((value) => !value)}
            onCopy={(address) => void copyAddress(address)}
            copied={copied}
          />
          <DetailRow label="Reference">
            <span className="font-mono text-xs">{reference}</span>
          </DetailRow>
          <DetailRow label="Requested On">
            <DateDisplay value={withdrawal.createdAt} />
          </DetailRow>
          <DetailRow label="Current Status">{status.label}</DetailRow>
        </dl>
      </DashboardPanelCard>

      <DashboardPanelCard title="What Happens Next?" accent="amber">
        <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          <li>Your withdrawal request has been received.</li>
          <li>Our Finance Team will review your request.</li>
          <li>Once approved, your funds will be sent to your selected wallet or bank account.</li>
          <li>
            You will receive an email notification when your withdrawal has been approved, rejected,
            or completed.
          </li>
        </ul>
      </DashboardPanelCard>

      {withdrawal.reviewReason ? (
        <DashboardPanelCard title="Review note" accent="primary">
          <p className="text-sm text-muted-foreground">{withdrawal.reviewReason}</p>
        </DashboardPanelCard>
      ) : null}

      {timeline.length > 0 ? (
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
      ) : null}

      <div className="flex flex-wrap gap-3">
        {destination.kind === "crypto" ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => void copyAddress(destination.address)}
          >
            {copied ? "Address copied" : "Copy Wallet Address"}
          </Button>
        ) : null}
        <Button asChild variant="ghost">
          <Link href="/wallet">Back to Wallet</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/wallet/withdrawals">Withdrawals</Link>
        </Button>
      </div>
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[10rem_1fr] sm:items-start sm:gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground">{children}</dd>
    </div>
  );
}

function DestinationRows({
  destination,
  showFullAddress,
  onToggleFull,
  onCopy,
  copied,
}: {
  destination: ParsedWithdrawalDestination;
  showFullAddress: boolean;
  onToggleFull: () => void;
  onCopy: (address: string) => void;
  copied: boolean;
}) {
  if (destination.kind === "crypto") {
    return (
      <>
        <DetailRow label="Withdrawal Method">{destination.methodLabel}</DetailRow>
        <DetailRow label="Network">{destination.networkLabel}</DetailRow>
        <DetailRow label="Destination Wallet">
          <div className="space-y-2">
            <p className="break-all font-mono text-xs">
              {showFullAddress ? destination.address : shortenWalletAddress(destination.address)}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onCopy(destination.address)}
              >
                {copied ? "Copied" : "Copy Address"}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={onToggleFull}>
                {showFullAddress ? "Hide Full Address" : "Show Full Address"}
              </Button>
            </div>
          </div>
        </DetailRow>
      </>
    );
  }

  if (destination.kind === "bank") {
    return (
      <>
        <DetailRow label="Withdrawal Method">Bank Transfer</DetailRow>
        <DetailRow label="Bank Name">{destination.bankName}</DetailRow>
        <DetailRow label="Account Name">{destination.accountName}</DetailRow>
        <DetailRow label="Account Number">{destination.accountNumber}</DetailRow>
      </>
    );
  }

  return <DetailRow label="Destination">{destination.summary}</DetailRow>;
}

function statusEmoji(status: string): string {
  const value = status.toLowerCase();
  if (["under_review", "requested", "pending"].includes(value)) return "🟡";
  if (["approved", "paid"].includes(value)) return "🟢";
  if (["rejected", "failed", "cancelled"].includes(value)) return "🔴";
  return "⚪";
}
