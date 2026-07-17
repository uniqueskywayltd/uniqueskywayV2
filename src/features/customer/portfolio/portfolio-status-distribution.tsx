"use client";

import { presentInvestmentStatus } from "@/features/customer/portfolio/status-presentation";
import type { PortfolioSummary } from "@/features/customer/portfolio/types";
import { useI18n } from "@/features/i18n/i18n-provider";
import { cn } from "@/lib/utils";

/** Certified status order from the investment engine — presentation only. */
const STATUS_ORDER = ["pending", "active", "maturing", "matured", "cancelled", "failed"] as const;

/**
 * PF4 — status distribution from certified `summary.byStatus` counts only.
 * No allocation pies, no client-derived percentages.
 */
export function PortfolioStatusDistribution({
  byStatus,
}: {
  byStatus: PortfolioSummary["byStatus"];
}) {
  const { t } = useI18n();

  const rows = STATUS_ORDER.map((status) => ({
    status,
    count: byStatus[status] ?? 0,
    label: presentInvestmentStatus(status, t).label,
  })).filter((row) => row.count > 0);

  if (rows.length === 0) {
    return null;
  }

  return (
    <section aria-label={t("portfolio.status.distribution_aria")} className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {t("portfolio.status.distribution")}
      </h2>
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((row) => (
          <li
            key={row.status}
            className={cn(
              "flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/90 px-4 py-3 shadow-sm",
            )}
          >
            <span className="text-sm font-medium text-foreground">{row.label}</span>
            <span className="font-mono text-sm tabular-nums text-muted-foreground">
              {row.count}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">{t("portfolio.status.distribution_hint")}</p>
    </section>
  );
}
