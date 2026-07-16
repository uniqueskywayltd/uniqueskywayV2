"use client";

import { cn } from "@/lib/utils";

import { humanizeStatus, statusEmoji, statusTone } from "../lib/presentation";

export function AdminStatusBadge({ status }: { status: string }) {
  const tone = statusTone(status);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium",
        tone === "warning" &&
          "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300",
        tone === "success" &&
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
        tone === "danger" && "border-destructive/30 bg-destructive/10 text-destructive",
        tone === "neutral" && "border-border bg-muted/40 text-muted-foreground",
      )}
    >
      <span aria-hidden="true">{statusEmoji(status)}</span>
      {humanizeStatus(status)}
    </span>
  );
}

export function AdminInfoSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
      <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </h2>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

export function AdminInfoRow({
  label,
  value,
  mono = false,
  emphasize = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  emphasize?: boolean;
}) {
  return (
    <div className="grid gap-1 sm:grid-cols-[10rem_1fr] sm:items-start sm:gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "text-sm text-foreground",
          emphasize && "text-base font-semibold tabular-nums",
          mono && "break-all font-mono text-xs",
        )}
      >
        {value || "—"}
      </dd>
    </div>
  );
}

/** Renders nested API payloads as plain English rows — never as raw JSON. */
export function AdminPlainRecord({
  title,
  record,
  preferKeys,
}: {
  title?: string;
  record: Record<string, unknown> | null | undefined;
  preferKeys?: string[];
}) {
  if (!record) return null;
  const keys = preferKeys?.length
    ? [
        ...preferKeys.filter((key) => key in record),
        ...Object.keys(record).filter((key) => !preferKeys.includes(key)),
      ]
    : Object.keys(record);

  const rows = keys
    .filter((key) => {
      const value = record[key];
      return value !== undefined && value !== null && typeof value !== "object";
    })
    .map((key) => ({
      key,
      label: humanizeFieldKey(key),
      value: String(record[key]),
    }));

  if (rows.length === 0) return null;

  return (
    <AdminInfoSection title={title ?? "Details"}>
      {rows.map((row) => (
        <AdminInfoRow key={row.key} label={row.label} value={row.value} />
      ))}
    </AdminInfoSection>
  );
}

function humanizeFieldKey(key: string): string {
  const map: Record<string, string> = {
    amountMinor: "Amount",
    providerIntentId: "Deposit Reference",
    confirmationLedgerTransactionId: "Ledger Transaction",
    provider: "Deposit Method",
    createdAt: "Submitted",
    updatedAt: "Last Updated",
    status: "Current Status",
    userId: "Customer",
    email: "Email Address",
    legalName: "Customer Name",
    displayName: "Username",
    accountNumber: "Customer ID",
    fundingAsset: "Asset",
    fundingNetwork: "Network",
    transactionHash: "Transaction Hash",
    customerNote: "Customer Note",
    destinationType: "Destination Type",
    destinationReference: "Destination",
    reviewReason: "Review Notes",
    providerPayoutReference: "Payout Reference",
    principalMinor: "Principal",
    postedRoiMinor: "Earnings Posted",
    gitCommit: "Software Version",
    releaseTag: "Release",
    application: "Application",
    version: "Version",
  };
  if (map[key]) return map[key];
  return key
    .replace(/Minor$/i, "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
