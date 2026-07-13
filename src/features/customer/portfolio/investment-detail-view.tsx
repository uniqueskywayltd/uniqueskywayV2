"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";

import { Button, Skeleton, StatusChip } from "@/components/ui";
import { CurrencyDisplay } from "@/components/ui/display";
import { getCustomerJson } from "@/features/customer/api-client";
import {
  presentInvestmentStatus,
  presentScheduleStatus,
} from "@/features/customer/portfolio/status-presentation";
import type { PortfolioDetailResponse } from "@/features/customer/portfolio/types";

export function InvestmentDetailView({ investmentId }: { investmentId: string }) {
  const [data, setData] = useState<PortfolioDetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    void getCustomerJson<PortfolioDetailResponse>(
      `/api/customer/investments/${investmentId}`,
    ).then((result) => {
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
  }, [investmentId]);

  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <section className="rounded-xl border border-destructive/30 p-6" role="alert">
        <h2 className="text-base font-semibold text-foreground">Investment unavailable</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {error ?? "We could not find that investment."}
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/portfolio">Back to portfolio</Link>
        </Button>
      </section>
    );
  }

  const { investment, schedule, lifecycle } = data;
  const status = presentInvestmentStatus(investment.status);

  return (
    <div className="space-y-8">
      <p className="sr-only">Primary question: How is this investment progressing?</p>

      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Investment</p>
          <h1 className="text-2xl font-semibold tracking-normal text-foreground">
            {investment.planName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Read-only view of certified investment progress.
          </p>
        </div>
        <StatusChip tone={status.tone}>{status.label}</StatusChip>
      </header>

      <section className="grid gap-4 sm:grid-cols-3" aria-label="Investment values">
        <ValueCard
          label="Principal"
          value={
            <CurrencyDisplay
              amountMinor={Number(investment.principalMinor)}
              currency={investment.currency}
            />
          }
        />
        <ValueCard
          label="ROI credited"
          value={
            <CurrencyDisplay
              amountMinor={Number(investment.postedRoiMinor)}
              currency={investment.currency}
            />
          }
        />
        <ValueCard
          label="Progress"
          value={
            <span className="font-mono tabular-nums">
              {investment.progressPercent === null ? "—" : `${investment.progressPercent}%`}
            </span>
          }
        />
      </section>

      <section aria-label="Lifecycle">
        <h2 className="text-base font-semibold text-foreground">Lifecycle</h2>
        <ol className="mt-4 space-y-3 border-l border-border pl-4">
          {lifecycle.map((step) => (
            <li key={step.key}>
              <p className="text-sm font-medium text-foreground">
                {step.label}
                {step.complete ? "" : " (upcoming)"}
              </p>
              <p className="text-sm text-muted-foreground">{step.at ?? "Not yet"}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-label="Settlement schedule">
        <h2 className="text-base font-semibold text-foreground">ROI / settlement schedule</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Dates use America/New_York settlement days. Credited means posted — not guaranteed future
          amounts.
        </p>
        {schedule.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No schedule items yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border rounded-xl border border-border/80">
            {schedule.map((item) => {
              const scheduleStatus = presentScheduleStatus(item.status);
              return (
                <li
                  key={item.id}
                  className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      #{item.sequenceNumber} · Earn {item.earningDate}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Settle {item.settlementDate}
                      {item.postedAt ? ` · Posted ${item.postedAt.slice(0, 10)}` : ""}
                    </p>
                  </div>
                  <StatusChip tone={scheduleStatus.tone}>{scheduleStatus.label}</StatusChip>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-label="Important notices" className="rounded-xl border border-border/80 p-5">
        <h2 className="text-base font-semibold text-foreground">Important notices</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          <li>{status.explanation}</li>
          <li>This page does not edit investments or move money.</li>
          <li>Returns are not guaranteed. Accrued schedule rows are not withdrawable until credited.</li>
        </ul>
      </section>

      <Button asChild variant="outline">
        <Link href="/portfolio">Back to portfolio</Link>
      </Button>
    </div>
  );
}

function ValueCard({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border border-border/80 p-4">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      <div className="mt-2 text-lg font-semibold text-foreground">{value}</div>
    </div>
  );
}
