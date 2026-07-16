"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Button, EmptyState, Skeleton, StatusChip } from "@/components/ui";
import { CurrencyDisplay, DateDisplay } from "@/components/ui/display";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCustomerJson } from "@/features/customer/api-client";
import { presentWithdrawalStatus } from "@/features/customer/wallet/status-presentation";
import type { WalletWithdrawal } from "@/features/customer/wallet/types";
import {
  withdrawalDestinationSummary,
  parseWithdrawalDestination,
} from "@/lib/withdrawal-destination";
import { cn } from "@/lib/utils";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "requested", label: "Requested" },
  { value: "reserved", label: "Reserved" },
  { value: "under_review", label: "Under review" },
  { value: "approved", label: "Approved" },
  { value: "processing", label: "Processing" },
  { value: "paid", label: "Paid" },
  { value: "rejected", label: "Rejected" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
] as const;

type FilterValue = (typeof FILTERS)[number]["value"];

/** WP3 — withdrawal history over certified withdrawal read models only. */
export function WithdrawalHistory() {
  const [withdrawals, setWithdrawals] = useState<WalletWithdrawal[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterValue>("all");

  useEffect(() => {
    let active = true;
    void getCustomerJson<{ withdrawals: WalletWithdrawal[] }>("/api/customer/withdrawals").then(
      (result) => {
        if (!active) return;
        if (result.error) {
          setError(result.error);
          setLoading(false);
          return;
        }
        setWithdrawals(result.data?.withdrawals ?? []);
        setLoading(false);
      },
    );
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return withdrawals;
    return withdrawals.filter((withdrawal) => withdrawal.status === filter);
  }, [withdrawals, filter]);

  if (error) {
    return (
      <p className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
        {error}
      </p>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading withdrawals">
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-8 w-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-56 w-full rounded-xl" />
      </div>
    );
  }

  if (withdrawals.length === 0) {
    return (
      <EmptyState
        icon={ArrowUpRight}
        title="No withdrawals"
        description="When you request a withdrawal, status and next steps stay visible so you always know what to expect."
        action={
          <Button asChild>
            <Link href="/wallet/withdrawals/new">New withdrawal</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter withdrawals by status">
        {FILTERS.map((option) => {
          const active = filter === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setFilter(option.value)}
              aria-pressed={active}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-sm motion-safe:transition-colors motion-safe:duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                active
                  ? "border-primary/30 bg-primary/10 font-medium text-primary"
                  : "border-border/70 bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/80 p-4 text-sm text-muted-foreground">
          No withdrawals match this status filter.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/70 bg-card/90 shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Amount</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead className="text-right">Detail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((withdrawal) => {
                const status = presentWithdrawalStatus(withdrawal.status);
                return (
                  <TableRow key={withdrawal.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium tabular-nums">
                      <CurrencyDisplay
                        amountMinor={Number(withdrawal.amountMinor)}
                        currency={withdrawal.currency}
                      />
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-foreground">
                        {withdrawalDestinationSummary(
                          parseWithdrawalDestination(
                            withdrawal.destinationType,
                            withdrawal.destinationReference,
                          ),
                        )}
                      </p>
                    </TableCell>
                    <TableCell>
                      <StatusChip tone={status.tone}>{status.label}</StatusChip>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <DateDisplay value={withdrawal.createdAt} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {withdrawal.paidAt ? <DateDisplay value={withdrawal.paidAt} /> : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/wallet/withdrawals/${withdrawal.id}`}
                        className="text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        View
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
