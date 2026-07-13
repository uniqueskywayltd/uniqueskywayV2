"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Button, Skeleton, StatusChip } from "@/components/ui";
import { CurrencyDisplay, DateDisplay } from "@/components/ui/display";
import { CustomerPageHeader } from "@/features/customer/components/page-header";
import { getCustomerJson } from "@/features/customer/api-client";
import {
  resolveDashboardWidgets,
  type DashboardWidgetDefinition,
  type DashboardWidgetId,
} from "@/features/customer/dashboard/widget-registry";
import { WHATS_NEW_ITEMS } from "@/application/customer/communication-presentation";
import { cn } from "@/lib/utils";

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

export function DashboardView() {
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
      <CustomerPageHeader
        title="Dashboard"
        description="How you’re doing today — your primary financial home."
      />
      <p className="sr-only">Primary question: How am I doing today?</p>

      {error ? (
        <p className="mb-4 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          Some dashboard figures could not load. Open Portfolio or Wallet directly, or retry by
          refreshing. {error}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {widgets.map((widget) => (
          <DashboardWidgetCard
            key={widget.id}
            widget={widget}
            loading={loading}
            data={data}
          />
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
  const priority = widget.hierarchyRank !== null;

  return (
    <section
      aria-label={widget.title}
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
              Priority {widget.hierarchyRank}
            </p>
          ) : (
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Supporting
            </p>
          )}
          <h2 className="mt-1 text-base font-semibold text-foreground">{widget.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{widget.primaryQuestion}</p>
        </div>
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="space-y-2" aria-busy="true" aria-label={`Loading ${widget.title}`}>
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
  if (widgetId === "quick-actions") {
    return (
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/wallet/deposits/new">Add funds</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/wallet/withdrawals/new">Withdraw</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/portfolio">View portfolio</Link>
        </Button>
      </div>
    );
  }

  if (widgetId === "portfolio-value") {
    const principal = data?.portfolio?.summary.activePrincipalMinor ?? "0";
    const count = data?.portfolio?.summary.totalCount ?? 0;
    if (count === 0) {
      return <EmptyCopy widget={widget} href="/portfolio" cta="Open portfolio" />;
    }
    return (
      <div>
        <p className="text-3xl font-semibold tracking-tight">
          <CurrencyDisplay amountMinor={Number(principal)} />
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Active principal from certified investments — not client ROI math.
        </p>
        <Button asChild variant="link" className="mt-2 h-auto px-0">
          <Link href="/portfolio">View portfolio</Link>
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
      return <EmptyCopy widget={widget} href="/wallet" cta="Open wallet" />;
    }
    return (
      <div>
        <p className="text-3xl font-semibold tracking-tight">
          <CurrencyDisplay amountMinor={Number(available)} />
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Pending{" "}
          <CurrencyDisplay amountMinor={Number(pending)} /> · Locked{" "}
          <CurrencyDisplay amountMinor={Number(locked)} />
        </p>
        <Button asChild variant="link" className="mt-2 h-auto px-0">
          <Link href="/wallet">Open wallet</Link>
        </Button>
      </div>
    );
  }

  if (widgetId === "todays-activity") {
    const today = (data?.wallet?.recentActivity ?? []).filter((item) =>
      isLikelyToday(item.at),
    );
    if (today.length === 0) {
      return <EmptyCopy widget={widget} href="/account/activity" cta="Open activity" />;
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
          Open deposit or withdrawal items need attention in Wallet.
        </p>
        <Button asChild variant="outline" className="mt-3">
          <Link href="/wallet">Review in wallet</Link>
        </Button>
      </div>
    );
  }

  if (widgetId === "investment-progress") {
    const active = (data?.portfolio?.investments ?? []).filter((item) =>
      ["active", "maturing"].includes(item.status),
    );
    if (active.length === 0) {
      return <EmptyCopy widget={widget} href="/portfolio" cta="Open portfolio" />;
    }
    const primary = active[0]!;
    const progress = primary.progressPercent ?? 0;
    return (
      <div>
        <p className="text-sm font-medium text-foreground">{primary.planName}</p>
        <p className="mt-2 text-2xl font-semibold">{progress}%</p>
        <p className="mt-1 text-sm text-muted-foreground">{primary.nextMilestone.label}</p>
        <Button asChild variant="link" className="mt-2 h-auto px-0">
          <Link href={`/portfolio/${primary.id}`}>View details</Link>
        </Button>
      </div>
    );
  }

  if (widgetId === "notifications") {
    const unread = data?.unreadNotifications ?? 0;
    if (unread === 0) {
      return <EmptyCopy widget={widget} href="/account/notifications" cta="Open notifications" />;
    }
    return (
      <div>
        <p className="text-2xl font-semibold">{unread} unread</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Security and money alerts take priority in the Notification Center.
        </p>
        <Button asChild variant="outline" className="mt-3">
          <Link href="/account/notifications">Open notifications</Link>
        </Button>
      </div>
    );
  }

  if (widgetId === "next-settlement") {
    const next = (data?.portfolio?.investments ?? []).find(
      (item) => item.nextMilestone.date && ["active", "maturing"].includes(item.status),
    );
    if (!next?.nextMilestone.date) {
      return <EmptyCopy widget={widget} href="/portfolio" cta="Open portfolio" />;
    }
    return (
      <div>
        <p className="text-sm font-medium text-foreground">{next.nextMilestone.label}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          <DateDisplay value={next.nextMilestone.date} /> · New York day expectancy
        </p>
      </div>
    );
  }

  if (widgetId === "money-timeline") {
    const items = data?.wallet?.recentActivity ?? [];
    if (items.length === 0) {
      return <EmptyCopy widget={widget} href="/ledger" cta="Open ledger" />;
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
      return <EmptyCopy widget={widget} href="/account/whats-new" cta="What’s New" />;
    }
    return (
      <div>
        <p className="text-sm font-medium text-foreground">{latest.title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{latest.summary}</p>
        <Button asChild variant="outline" className="mt-3">
          <Link href="/account/whats-new">What’s New</Link>
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
  return (
    <div>
      <p className="text-sm font-medium text-foreground">{widget.emptyTitle}</p>
      <p className="mt-1 text-sm text-muted-foreground">{widget.emptyDescription}</p>
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
