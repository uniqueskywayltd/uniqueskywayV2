"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Wallet } from "lucide-react";

import { Button, EmptyState, Skeleton, StatusChip } from "@/components/ui";
import { CurrencyDisplay, DateDisplay } from "@/components/ui/display";
import { getCustomerJson } from "@/features/customer/api-client";
import {
  presentDepositStatus,
  presentWithdrawalStatus,
} from "@/features/customer/wallet/status-presentation";
import type { MoneyTimelineItem, WalletOverviewResponse } from "@/features/customer/wallet/types";

export function WalletOverview() {
  const [data, setData] = useState<WalletOverviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void getCustomerJson<WalletOverviewResponse>("/api/customer/wallet").then((result) => {
      if (!active) return;
      if (result.error) {
        setError(result.error);
        setData(null);
        setLoading(false);
        return;
      }
      setError(null);
      setData(result.data ?? null);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return (
      <section className="rounded-xl border border-border/80 p-6">
        <h2 className="text-base font-semibold text-foreground">Wallet unavailable</h2>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/contact">Contact support</Link>
        </Button>
      </section>
    );
  }

  if (loading || !data) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading wallet">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  const { balances } = data;
  const isEmpty =
    balances.availableBalanceMinor === "0" &&
    balances.pendingBalanceMinor === "0" &&
    balances.lockedBalanceMinor === "0" &&
    data.recentActivity.length === 0;

  return (
    <div className="space-y-8">
      <p className="sr-only">Primary question: How do I safely move money?</p>

      <section aria-label="Available balance" className="rounded-xl border border-border/80 p-6">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          1 · Available
        </p>
        <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
          <CurrencyDisplay amountMinor={Number(balances.availableBalanceMinor)} />
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Withdrawable now equals Available — {balances.currency} from the certified ledger.
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <BalanceTile
          rank="2"
          title="Pending deposits"
          amountMinor={balances.pendingBalanceMinor}
          hint={
            data.pendingDepositCount > 0
              ? `${data.pendingDepositCount} deposit(s) not final yet.`
              : "No pending deposit funds."
          }
        />
        <BalanceTile
          rank="3"
          title="Locked funds"
          amountMinor={balances.lockedBalanceMinor}
          hint={
            balances.reservedBalanceMinor !== "0"
              ? `Includes reserved for withdrawal: displayed separately as ${formatMinor(balances.reservedBalanceMinor)} reserved.`
              : "Committed to investments or platform rules."
          }
          reservedMinor={balances.reservedBalanceMinor}
        />
      </div>

      <section aria-label="Recent activity" className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              4 · Recent activity
            </p>
            <h2 className="mt-1 text-base font-semibold text-foreground">Money timeline</h2>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/ledger">Full ledger</Link>
          </Button>
        </div>

        {isEmpty ? (
          <EmptyState
            icon={Wallet}
            title="Your wallet is ready"
            description="Add funds when you’re ready. Deposits feel safe — not rushed. Accrued investment earnings are not Available until credited."
            action={
              <Button asChild>
                <Link href="/wallet/deposits/new">Add funds</Link>
              </Button>
            }
          />
        ) : data.recentActivity.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border/80 p-4 text-sm text-muted-foreground">
            No recent money movements yet. Funding and withdrawals will appear here.
          </p>
        ) : (
          <ul className="divide-y divide-border/70 rounded-xl border border-border/80">
            {data.recentActivity.map((item) => (
              <TimelineRow key={item.id} item={item} />
            ))}
          </ul>
        )}
      </section>

      <section aria-label="Move money" className="space-y-3">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          5–6 · Move money
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/wallet/deposits/new">Start deposit</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/wallet/withdrawals/new">Start withdrawal</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/wallet/deposits">Funding history</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/wallet/withdrawals">Withdrawal history</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/account/notifications">Notifications</Link>
          </Button>
        </div>
      </section>

      <section className="rounded-xl border border-border/60 bg-muted/20 p-5">
        <h2 className="text-sm font-semibold text-foreground">Balance vocabulary</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Accrued earnings live on Portfolio — they never look like Available here.
        </p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          {data.vocabulary.map((term) => (
            <div key={term.id}>
              <dt className="text-sm font-medium text-foreground">{term.label}</dt>
              <dd className="text-sm text-muted-foreground">{term.customerWording}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}

function BalanceTile({
  rank,
  title,
  amountMinor,
  hint,
  reservedMinor,
}: {
  rank: string;
  title: string;
  amountMinor: string;
  hint: string;
  reservedMinor?: string;
}) {
  return (
    <section className="rounded-xl border border-border/80 p-5">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {rank} · {title}
      </p>
      <p className="mt-2 text-xl font-semibold text-foreground">
        <CurrencyDisplay amountMinor={Number(amountMinor)} />
      </p>
      {reservedMinor && reservedMinor !== "0" ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Reserved for withdrawal:{" "}
          <CurrencyDisplay amountMinor={Number(reservedMinor)} />
        </p>
      ) : null}
      <p className="mt-2 text-sm text-muted-foreground">{hint}</p>
    </section>
  );
}

function TimelineRow({ item }: { item: MoneyTimelineItem }) {
  const presentation =
    item.kind === "withdrawal"
      ? presentWithdrawalStatus(item.status)
      : item.kind === "deposit"
        ? presentDepositStatus(item.status)
        : { label: "Credited", tone: "matured" as const };

  return (
    <li>
      <Link
        href={item.href}
        className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-muted/30"
      >
        <div>
          <p className="text-sm font-medium text-foreground">{item.title}</p>
          <p className="text-xs text-muted-foreground">
            <DateDisplay value={item.at} />
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusChip tone={presentation.tone}>{presentation.label}</StatusChip>
          <CurrencyDisplay amountMinor={Number(item.amountMinor)} className="text-sm font-medium" />
        </div>
      </Link>
    </li>
  );
}

function formatMinor(minor: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    Number(minor) / 100,
  );
}
