"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDownLeft } from "lucide-react";

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
import { useI18n } from "@/features/i18n/i18n-provider";
import { presentDepositStatus } from "@/features/customer/wallet/status-presentation";
import type { WalletDeposit } from "@/features/customer/wallet/types";
import { cn } from "@/lib/utils";

const FILTERS = [
  { value: "all", labelKey: "ui.all" },
  { value: "created", labelKey: "status.deposit.filter.created" },
  { value: "pending", labelKey: "ui.pending" },
  { value: "confirmed", labelKey: "status.deposit.confirmed" },
  { value: "failed", labelKey: "ui.failed" },
  { value: "cancelled", labelKey: "ui.cancelled" },
] as const;

type FilterValue = (typeof FILTERS)[number]["value"];

/** WP2 — deposit history over certified deposit read models only. */
export function DepositHistory() {
  const { t } = useI18n();
  const [deposits, setDeposits] = useState<WalletDeposit[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterValue>("all");

  useEffect(() => {
    let active = true;
    void getCustomerJson<{ deposits: WalletDeposit[] }>("/api/customer/deposits").then((result) => {
      if (!active) return;
      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }
      setDeposits(result.data?.deposits ?? []);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return deposits;
    return deposits.filter((deposit) => deposit.status === filter);
  }, [deposits, filter]);

  if (error) {
    return (
      <p className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
        {error}
      </p>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label={t("wallet.loading_deposits")}>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-8 w-20 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-56 w-full rounded-xl" />
      </div>
    );
  }

  if (deposits.length === 0) {
    return (
      <EmptyState
        icon={ArrowDownLeft}
        title={t("wallet.deposits_empty_title")}
        description={t("wallet.deposits_empty_body")}
        action={
          <Button asChild>
            <Link href="/wallet/deposits/new">{t("wallet.new_deposit")}</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label={t("wallet.deposits_filter_aria")}
      >
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
              {t(option.labelKey)}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/80 p-4 text-sm text-muted-foreground">
          {t("wallet.deposits_no_filter_match")}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/70 bg-card/90 shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("wallet.amount")}</TableHead>
                <TableHead>{t("wallet.table.provider")}</TableHead>
                <TableHead>{t("ui.status")}</TableHead>
                <TableHead>{t("ui.created")}</TableHead>
                <TableHead className="text-right">{t("ui.detail")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((deposit) => {
                const status = presentDepositStatus(deposit.status, t);
                return (
                  <TableRow key={deposit.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium tabular-nums">
                      <CurrencyDisplay
                        amountMinor={Number(deposit.amountMinor)}
                        currency={deposit.currency}
                      />
                    </TableCell>
                    <TableCell className="capitalize text-muted-foreground">
                      {deposit.provider.replaceAll("_", " ")}
                    </TableCell>
                    <TableCell>
                      <StatusChip tone={status.tone}>{status.label}</StatusChip>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <DateDisplay value={deposit.createdAt} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/wallet/deposits/${deposit.id}`}
                        className="text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        {t("ui.view")}
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
