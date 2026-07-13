"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FileText } from "lucide-react";

import { Button, EmptyState, Skeleton } from "@/components/ui";
import { CurrencyDisplay, DateDisplay } from "@/components/ui/display";
import { getCustomerJson, postCustomerJson } from "@/features/customer/api-client";
import type { StatementDetail } from "@/features/customer/statements/types";

export function StatementDetailView() {
  const params = useParams<{ statementId: string }>();
  const statementId = decodeURIComponent(params.statementId ?? "");
  const [detail, setDetail] = useState<StatementDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadNote, setDownloadNote] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void getCustomerJson<StatementDetail>(
      `/api/customer/statements/${encodeURIComponent(statementId)}`,
    ).then((result) => {
      if (!active) return;
      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }
      setDetail(result.data ?? null);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [statementId]);

  async function downloadCsv() {
    if (!detail) return;
    const rows = [
      ["posted_at", "label", "direction", "amount_minor", "currency", "wallet_category", "type"],
      ...detail.lines.map((line) => [
        line.postedAt,
        line.label,
        line.direction,
        line.amountMinor,
        line.currency,
        line.walletCategory,
        line.transactionType,
      ]),
    ];
    const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${detail.id}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);

    const recorded = await postCustomerJson<{ recorded: boolean }>(
      `/api/customer/statements/${encodeURIComponent(statementId)}/download`,
      {},
    );
    setDownloadNote(
      recorded.error
        ? "Download started — same totals as on screen. History could not be recorded."
        : "Download started — same totals as on screen.",
    );
  }

  if (loading) {
    return <Skeleton className="h-64 w-full rounded-xl" aria-label="Loading statement" />;
  }

  if (error || !detail) {
    return (
      <EmptyState
        icon={FileText}
        title="Statement unavailable"
        description={error ?? "This statement could not be projected from your ledger."}
        action={
          <Button asChild>
            <Link href="/account/statements">Back to statements</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6 print:space-y-4">
      <p className="sr-only">Primary question: Can I understand my financial history?</p>

      <section className="rounded-xl border border-border/80 p-5 print:border-black">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {detail.typeLabel}
        </p>
        <h2 className="mt-1 text-xl font-semibold">{detail.periodLabel}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{detail.periodBounds}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Timezone: {detail.timezone} (financial calendar)
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Projected at <DateDisplay value={detail.projectedAt} /> — rebuilt from your ledger each
          time you open it.
        </p>
        <p className="mt-3 text-sm text-muted-foreground">{detail.understanding}</p>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <SummaryTile label="Period credits" amountMinor={detail.summary.creditTotalMinor} />
        <SummaryTile label="Period debits" amountMinor={detail.summary.debitTotalMinor} />
        <SummaryTile
          label="Period net activity"
          amountMinor={detail.summary.periodNetMinor}
          hint={detail.summary.note}
        />
      </section>

      {detail.categoryTotals.length > 0 ? (
        <section className="space-y-2">
          <h3 className="text-sm font-semibold">Wallet category totals (this period)</h3>
          <ul className="divide-y divide-border/70 rounded-xl border border-border/80">
            {detail.categoryTotals.map((row) => (
              <li
                key={row.category}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
              >
                <span className="capitalize">{row.category}</span>
                <span className="text-muted-foreground">
                  Cr <CurrencyDisplay amountMinor={Number(row.creditTotalMinor)} /> · Dr{" "}
                  <CurrencyDisplay amountMinor={Number(row.debitTotalMinor)} />
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="flex flex-wrap gap-2 print:hidden">
        <Button type="button" onClick={() => void downloadCsv()}>
          Download CSV
        </Button>
        <Button type="button" variant="outline" onClick={() => window.print()}>
          Print
        </Button>
        <Button asChild variant="outline">
          <Link href={detail.related.ledgerHref}>View live ledger</Link>
        </Button>
      </div>
      {downloadNote ? <p className="text-sm text-muted-foreground print:hidden">{downloadNote}</p> : null}

      <section className="space-y-2">
        <h3 className="text-sm font-semibold">Line items ({detail.lineCount})</h3>
        {detail.lines.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity in this period.</p>
        ) : (
          <ul className="divide-y divide-border/70 rounded-xl border border-border/80">
            {detail.lines.map((line) => (
              <li
                key={`${line.id}-${line.walletCategory}-${line.postedAt}`}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium">{line.label}</p>
                  <p className="text-xs text-muted-foreground">
                    <DateDisplay value={line.postedAt} /> · {line.walletCategory} ·{" "}
                    {line.direction === "credit" ? "Credit" : "Debit"}
                  </p>
                </div>
                <CurrencyDisplay
                  amountMinor={Number(line.amountMinor)}
                  className="text-sm font-medium"
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="border-t pt-4 text-xs text-muted-foreground">{detail.footer}</footer>

      <div className="flex flex-wrap gap-3 print:hidden">
        <Button asChild variant="link" className="h-auto px-0">
          <Link href="/account/statements">Back to statements</Link>
        </Button>
        <Button asChild variant="link" className="h-auto px-0">
          <Link href={detail.related.successHref}>Success Hub</Link>
        </Button>
      </div>
    </div>
  );
}

function SummaryTile({
  label,
  amountMinor,
  hint,
}: {
  label: string;
  amountMinor: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border/80 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <CurrencyDisplay amountMinor={Number(amountMinor)} className="mt-2 text-lg font-semibold" />
      {hint ? <p className="mt-2 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}
