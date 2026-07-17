"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Button, Skeleton, StatusChip } from "@/components/ui";
import { CurrencyDisplay, DateDisplay } from "@/components/ui/display";
import { getCustomerJson } from "@/features/customer/api-client";
import {
  resolveDashboardWidgets,
  type DashboardWidgetDefinition,
  type DashboardWidgetId,
} from "@/features/customer/dashboard/widget-registry";
import { WHATS_NEW_ITEMS } from "@/application/customer/communication-presentation";
import { useI18n } from "@/features/i18n/i18n-provider";
import { cn } from "@/lib/utils";

function widgetMessageKey(widgetId: DashboardWidgetId, field: string) {
  return `dashboard.widget.${widgetId.replace(/-/g, "_")}.${field}`;
}

interface WalletOverviewPayload {
  balances: {
    availableBalanceMinor: string;
    pendingBalanceMinor: string;
    lockedBalanceMinor: string;
  };
  recentActivity: Array<{
    id: string;
    title: string;
    amountMinor: string;
    status: string;
    at: string;
    href: string;
  }>;
  pendingDepositCount: number;
  openWithdrawalCount: number;
}

interface PortfolioListPayload {
  summary: {
    totalCount: number;
    activePrincipalMinor: string;
    byStatus: Record<string, number>;
  };
  investments: Array<{
    id: string;
    planName: string;
    status: string;
    principalMinor: string;
    progressPercent: number | null;
    nextMilestone: { label: string; date: string | null };
  }>;
}

interface NotificationsPayload {
  unreadCount: number;
}

interface DashboardData {
  wallet: WalletOverviewPayload | null;
  portfolio: PortfolioListPayload | null;
  unreadNotifications: number;
}

/** DP2+ widget surface — preserved from Sprint B1; not mounted in DP1 frame. */
export function DashboardWidgetSurface() {
  const { t } = useI18n();
  const widgets = resolveDashboardWidgets();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    void Promise.all([
      getCustomerJson<WalletOverviewPayload>("/api/customer/wallet"),
      getCustomerJson<PortfolioListPayload>("/api/customer/investments?bucket=all&sort=newest"),
      getCustomerJson<NotificationsPayload>("/api/customer/notifications?unreadOnly=true"),
    ]).then(([wallet, portfolio, notifications]) => {
      if (!active) return;
      const firstError = wallet.error ?? portfolio.error ?? notifications.error ?? null;
      setError(firstError);
      setData({
        wallet: wallet.data ?? null,
        portfolio: portfolio.data ?? null,
        unreadNotifications: notifications.data?.unreadCount ?? 0,
      });
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div>
      {error ? (
        <p className="mb-4 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {t("dashboard.widgets.load_error")} {error}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {widgets.map((widget) => (
          <DashboardWidgetCard key={widget.id} widget={widget} loading={loading} data={data} />
        ))}
      </div>
    </div>
  );
}

function DashboardWidgetCard({
  widget,
  loading,
  data,
}: {
  widget: DashboardWidgetDefinition;
  loading: boolean;
  data: DashboardData | null;
}) {
  const { t } = useI18n();
  const priority = widget.hierarchyRank !== null;
  const title = t(widgetMessageKey(widget.id, "title"));
  const primaryQuestion = t(widgetMessageKey(widget.id, "question"));

  return (
    <section
      aria-label={title}
      data-widget-id={widget.id}
      data-hierarchy-rank={widget.hierarchyRank ?? undefined}
      className={cn(
        "rounded-xl border border-border/80 bg-background p-5 shadow-[var(--elevation-1)]",
        priority && widget.hierarchyRank !== null && widget.hierarchyRank <= 2 && "lg:col-span-1",
        widget.id === "quick-actions" && "lg:col-span-2",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          {widget.hierarchyRank !== null ? (
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {t("dashboard.widgets.priority", { rank: widget.hierarchyRank })}
            </p>
          ) : (
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {t("dashboard.widgets.supporting")}
            </p>
          )}
          <h2 className="mt-1 text-base font-semibold text-foreground">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{primaryQuestion}</p>
        </div>
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="space-y-2" aria-busy="true" aria-label={title}>
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : (
          <DashboardWidgetBody widgetId={widget.id} widget={widget} data={data} />
        )}
      </div>
    </section>
  );
}

function DashboardWidgetBody({
  widgetId,
  widget,
  data,
}: {
  widgetId: DashboardWidgetId;
  widget: DashboardWidgetDefinition;
  data: DashboardData | null;
}) {
  const { t } = useI18n();

  if (widgetId === "quick-actions") {
    return (
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/wallet/deposits/new">{t("dashboard.widgets.add_funds")}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/wallet/withdrawals/new">{t("dashboard.widgets.withdraw")}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/portfolio">{t("dashboard.widgets.view_investments")}</Link>
        </Button>
      </div>
    );
  }

  if (widgetId === "portfolio-value") {
    const principal = data?.portfolio?.summary.activePrincipalMinor ?? "0";
    const count = data?.portfolio?.summary.totalCount ?? 0;
    if (count === 0) {
      return (
        <EmptyCopy widget={widget} href="/portfolio" cta={t("dashboard.widgets.open_portfolio")} />
      );
    }
    return (
      <div>
        <p className="text-3xl font-semibold tracking-tight">
          <CurrencyDisplay amountMinor={Number(principal)} />
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("dashboard.widgets.active_principal_hint")}
        </p>
        <Button asChild variant="link" className="mt-2 h-auto px-0">
          <Link href="/portfolio">{t("dashboard.widgets.view_investments")}</Link>
        </Button>
      </div>
    );
  }

  if (widgetId === "available-balance") {
    const available = data?.wallet?.balances.availableBalanceMinor ?? "0";
    const pending = data?.wallet?.balances.pendingBalanceMinor ?? "0";
    const locked = data?.wallet?.balances.lockedBalanceMinor ?? "0";
    const empty = available === "0" && pending === "0" && locked === "0";
    if (empty) {
      return <EmptyCopy widget={widget} href="/wallet" cta={t("dashboard.widgets.open_wallet")} />;
    }
    return (
      <div>
        <p className="text-3xl font-semibold tracking-tight">
          <CurrencyDisplay amountMinor={Number(available)} />
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("wallet.pending")} <CurrencyDisplay amountMinor={Number(pending)} /> ·{" "}
          {t("dashboard.widgets.locked")} <CurrencyDisplay amountMinor={Number(locked)} />
        </p>
        <Button asChild variant="link" className="mt-2 h-auto px-0">
          <Link href="/wallet">{t("dashboard.widgets.open_wallet")}</Link>
        </Button>
      </div>
    );
  }

  if (widgetId === "todays-activity") {
    const today = (data?.wallet?.recentActivity ?? []).filter((item) => isLikelyToday(item.at));
    if (today.length === 0) {
      return (
        <EmptyCopy
          widget={widget}
          href="/account/activity"
          cta={t("dashboard.widgets.open_activity")}
        />
      );
    }
    return (
      <ul className="space-y-2">
        {today.slice(0, 3).map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
            <Link href={item.href} className="font-medium text-foreground hover:underline">
              {item.title}
            </Link>
            <CurrencyDisplay amountMinor={Number(item.amountMinor)} />
          </li>
        ))}
      </ul>
    );
  }

  if (widgetId === "pending-actions") {
    const pending =
      (data?.wallet?.pendingDepositCount ?? 0) + (data?.wallet?.openWithdrawalCount ?? 0);
    if (pending === 0) {
      return <EmptyCopy widget={widget} />;
    }
    return (
      <div>
        <p className="text-2xl font-semibold">{pending}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("dashboard.widgets.pending_attention")}
        </p>
        <Button asChild variant="outline" className="mt-3">
          <Link href="/wallet">{t("dashboard.widgets.review_wallet")}</Link>
        </Button>
      </div>
    );
  }

  if (widgetId === "investment-progress") {
    const active = (data?.portfolio?.investments ?? []).filter((item) =>
      ["active", "maturing"].includes(item.status),
    );
    if (active.length === 0) {
      return (
        <EmptyCopy widget={widget} href="/portfolio" cta={t("dashboard.widgets.open_portfolio")} />
      );
    }
    const primary = active[0]!;
    const progress = primary.progressPercent ?? 0;
    return (
      <div>
        <p className="text-sm font-medium text-foreground">{primary.planName}</p>
        <p className="mt-2 text-2xl font-semibold">{progress}%</p>
        <p className="mt-1 text-sm text-muted-foreground">{primary.nextMilestone.label}</p>
        <Button asChild variant="link" className="mt-2 h-auto px-0">
          <Link href={`/portfolio/${primary.id}`}>{t("dashboard.widgets.view_details")}</Link>
        </Button>
      </div>
    );
  }

  if (widgetId === "notifications") {
    const unread = data?.unreadNotifications ?? 0;
    if (unread === 0) {
      return (
        <EmptyCopy
          widget={widget}
          href="/account/notifications"
          cta={t("dashboard.widgets.open_notifications")}
        />
      );
    }
    return (
      <div>
        <p className="text-2xl font-semibold">
          {t("dashboard.widgets.unread_count", { count: unread })}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("dashboard.widgets.notifications_priority")}
        </p>
        <Button asChild variant="outline" className="mt-3">
          <Link href="/account/notifications">{t("dashboard.widgets.open_notifications")}</Link>
        </Button>
      </div>
    );
  }

  if (widgetId === "next-settlement") {
    const next = (data?.portfolio?.investments ?? []).find(
      (item) => item.nextMilestone.date && ["active", "maturing"].includes(item.status),
    );
    if (!next?.nextMilestone.date) {
      return (
        <EmptyCopy widget={widget} href="/portfolio" cta={t("dashboard.widgets.open_portfolio")} />
      );
    }
    return (
      <div>
        <p className="text-sm font-medium text-foreground">{next.nextMilestone.label}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          <DateDisplay value={next.nextMilestone.date} /> ·{" "}
          {t("dashboard.widgets.settlement_expectancy")}
        </p>
      </div>
    );
  }

  if (widgetId === "money-timeline") {
    const items = data?.wallet?.recentActivity ?? [];
    if (items.length === 0) {
      return <EmptyCopy widget={widget} href="/ledger" cta={t("dashboard.widgets.open_ledger")} />;
    }
    return (
      <ul className="space-y-2">
        {items.slice(0, 4).map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-2 text-sm">
            <Link href={item.href} className="truncate hover:underline">
              {item.title}
            </Link>
            <StatusChip tone="pending">{item.status}</StatusChip>
          </li>
        ))}
      </ul>
    );
  }

  if (widgetId === "whats-new") {
    const latest = WHATS_NEW_ITEMS[0];
    if (!latest) {
      return <EmptyCopy widget={widget} href="/account/whats-new" cta={t("whats_new.title")} />;
    }
    return (
      <div>
        <p className="text-sm font-medium text-foreground">{latest.title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{latest.summary}</p>
        <Button asChild variant="outline" className="mt-3">
          <Link href="/account/whats-new">{t("whats_new.title")}</Link>
        </Button>
      </div>
    );
  }

  return <EmptyCopy widget={widget} />;
}

function EmptyCopy({
  widget,
  href,
  cta,
}: {
  widget: DashboardWidgetDefinition;
  href?: string;
  cta?: string;
}) {
  const { t } = useI18n();

  return (
    <div>
      <p className="text-sm font-medium text-foreground">
        {t(widgetMessageKey(widget.id, "empty_title"))}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {t(widgetMessageKey(widget.id, "empty_description"))}
      </p>
      {href && cta ? (
        <Button asChild variant="outline" className="mt-4">
          <Link href={href}>{cta}</Link>
        </Button>
      ) : null}
    </div>
  );
}

function isLikelyToday(iso: string) {
  const value = new Date(iso);
  const now = new Date();
  return (
    value.getUTCFullYear() === now.getUTCFullYear() &&
    value.getUTCMonth() === now.getUTCMonth() &&
    value.getUTCDate() === now.getUTCDate()
  );
}
