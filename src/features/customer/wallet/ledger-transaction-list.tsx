"use client";

import Link from "next/link";

import { CurrencyDisplay, DateDisplay } from "@/components/ui/display";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { LedgerEntryRow } from "@/features/customer/wallet/types";
import { cn } from "@/lib/utils";

function LedgerAmount({ entry }: { entry: LedgerEntryRow }) {
  return (
    <span
      className={cn(
        "font-medium tabular-nums",
        entry.direction === "credit"
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-rose-600 dark:text-rose-400",
      )}
    >
      {entry.direction === "credit" ? "+" : "−"}
      <CurrencyDisplay amountMinor={Number(entry.amountMinor)} currency={entry.currency} />
    </span>
  );
}

/** Certified ledger rows — exact API order, no derived balances or merged entries. */
export function LedgerTransactionTable({ entries }: { entries: LedgerEntryRow[] }) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Activity</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell className="font-medium">
                {entry.href ? (
                  <Link
                    href={entry.href}
                    className="hover:text-primary hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
                  >
                    {entry.label}
                  </Link>
                ) : (
                  entry.label
                )}
              </TableCell>
              <TableCell className="text-right">
                <LedgerAmount entry={entry} />
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                <DateDisplay value={entry.postedAt} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/** Card layout for narrow viewports — same fields, same order as the table. */
export function LedgerTransactionCards({ entries }: { entries: LedgerEntryRow[] }) {
  return (
    <ul className="divide-y divide-border/70 rounded-xl border border-border/80" role="list">
      {entries.map((entry) => {
        const content = (
          <>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{entry.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                <DateDisplay value={entry.postedAt} />
                {entry.walletCategory ? (
                  <span className="capitalize"> · {entry.walletCategory.replace(/_/g, " ")}</span>
                ) : null}
              </p>
            </div>
            <LedgerAmount entry={entry} />
          </>
        );

        return (
          <li key={entry.id}>
            {entry.href ? (
              <Link
                href={entry.href}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset motion-safe:transition-colors motion-safe:duration-200 motion-reduce:transition-none"
              >
                {content}
              </Link>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                {content}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** Responsive ledger presentation — table on md+, cards on small screens. */
export function LedgerTransactionList({ entries }: { entries: LedgerEntryRow[] }) {
  return (
    <>
      <div className="md:hidden">
        <LedgerTransactionCards entries={entries} />
      </div>
      <div className="hidden md:block">
        <LedgerTransactionTable entries={entries} />
      </div>
    </>
  );
}
