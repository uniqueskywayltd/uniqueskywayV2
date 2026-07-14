"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, Bell } from "lucide-react";

import { Badge, EmptyState, Skeleton } from "@/components/ui";
import { DashboardPanelCard } from "@/components/ui/dashboard-panel-card";
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
import type { CustomerNotification } from "@/features/customer/types";
import { cn } from "@/lib/utils";

interface LedgerEntry {
  id: string;
  label: string;
  amountMinor: string;
  direction: "debit" | "credit";
  currency: string;
  postedAt: string;
}

interface LedgerPayload {
  currency: string;
  entries: LedgerEntry[];
}

interface NotificationsPayload {
  notifications: CustomerNotification[];
  unreadCount: number;
}

const RECENT_LIMIT = 6;

/** DP3 — recent activity + notifications from certified read models only. */
export function DashboardActivitySection() {
  const [ledger, setLedger] = useState<LedgerPayload | null>(null);
  const [notifications, setNotifications] = useState<CustomerNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    void Promise.all([
      getCustomerJson<LedgerPayload>("/api/customer/ledger"),
      getCustomerJson<NotificationsPayload>("/api/customer/notifications"),
    ]).then(([ledgerResult, notificationsResult]) => {
      if (!active) return;
      setError(ledgerResult.error ?? notificationsResult.error ?? null);
      setLedger(ledgerResult.data ?? null);
      setNotifications(notificationsResult.data?.notifications ?? []);
      setUnreadCount(notificationsResult.data?.unreadCount ?? 0);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="grid gap-6 lg:grid-cols-2" aria-busy="true" aria-label="Loading activity">
        <Skeleton className="h-[240px] w-full rounded-xl" />
        <Skeleton className="h-[240px] w-full rounded-xl" />
      </div>
    );
  }

  if (error && !ledger && notifications.length === 0) {
    return (
      <p className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
        Activity could not load. Open Ledger or Notifications directly, or refresh. {error}
      </p>
    );
  }

  const recentEntries = (ledger?.entries ?? []).slice(0, RECENT_LIMIT);
  const recentNotifications = notifications.slice(0, RECENT_LIMIT);

  return (
    <section className="space-y-4" aria-label="Activity">
      {unreadCount > 0 ? (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-sm"
        >
          <p className="text-foreground">
            You have{" "}
            <span className="font-semibold tabular-nums">{unreadCount}</span> unread{" "}
            {unreadCount === 1 ? "notification" : "notifications"}.
          </p>
          <Link
            href="/account/notifications"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Review alerts
          </Link>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardPanelCard title="Recent activity" href="/ledger" accent="sky">
          {recentEntries.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No recent activity"
              description="Ledger movements will appear here when funds are deposited, invested, or settled."
              className="min-h-36 border-0 bg-transparent p-3 sm:p-4"
            />
          ) : (
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
                  {recentEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{entry.label}</TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-medium tabular-nums",
                          entry.direction === "credit"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400",
                        )}
                      >
                        {entry.direction === "credit" ? "+" : "−"}
                        <CurrencyDisplay
                          amountMinor={Number(entry.amountMinor)}
                          currency={entry.currency}
                        />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <DateDisplay value={entry.postedAt} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DashboardPanelCard>

        <DashboardPanelCard
          title="Notifications"
          href="/account/notifications"
          accent="primary"
          badge={
            unreadCount > 0 ? (
              <Badge variant="destructive" className="tabular-nums">
                {unreadCount}
              </Badge>
            ) : null
          }
        >
          {recentNotifications.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="No notifications"
              description="Security and money alerts will show here when something needs attention."
              className="min-h-36 border-0 bg-transparent p-3 sm:p-4"
            />
          ) : (
            <ul className="space-y-2" role="list">
              {recentNotifications.map((notification) => {
                const unread = !notification.readAt;
                const content = (
                  <>
                    <p className="truncate font-medium text-foreground">{notification.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      <DateDisplay value={notification.createdAt} />
                      {notification.category ? (
                        <span className="capitalize"> · {notification.category}</span>
                      ) : null}
                    </p>
                  </>
                );

                return (
                  <li
                    key={notification.id}
                    className={cn(
                      "rounded-lg border border-border/60 bg-card px-4 py-3",
                      unread && "border-l-2 border-l-primary",
                    )}
                  >
                    {notification.href ? (
                      <Link
                        href={notification.href}
                        className="block min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {content}
                      </Link>
                    ) : (
                      <div className="min-w-0">{content}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </DashboardPanelCard>
      </div>
    </section>
  );
}
