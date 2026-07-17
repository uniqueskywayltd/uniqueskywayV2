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
import { useI18n } from "@/features/i18n/i18n-provider";
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
  const { t } = useI18n();
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
      <div className="grid gap-6 lg:grid-cols-2" aria-busy="true" aria-label={t("ui.loading")}>
        <Skeleton className="h-[240px] w-full rounded-xl" />
        <Skeleton className="h-[240px] w-full rounded-xl" />
      </div>
    );
  }

  if (error && !ledger && notifications.length === 0) {
    return (
      <p className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
        {t("activity.load_error")} {error}
      </p>
    );
  }

  const recentEntries = (ledger?.entries ?? []).slice(0, RECENT_LIMIT);
  const recentNotifications = notifications.slice(0, RECENT_LIMIT);
  const notificationWord =
    unreadCount === 1 ? t("activity.notification_singular") : t("activity.notification_plural");

  return (
    <section className="space-y-4" aria-label={t("nav.activity")}>
      {unreadCount > 0 ? (
        <div
          role="status"
          aria-live="polite"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-sm"
        >
          <p className="text-foreground">
            {t("activity.unread_banner", {
              count: unreadCount,
              notifications: notificationWord,
            })}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/account/notifications"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {t("activity.review_alerts")}
            </Link>
            <Link
              href="/account/communications"
              className="font-medium text-muted-foreground underline-offset-4 hover:underline"
            >
              {t("communications.center")}
            </Link>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardPanelCard title={t("activity.title")} href="/ledger" accent="sky">
          {recentEntries.length === 0 ? (
            <EmptyState
              icon={Activity}
              title={t("activity.empty")}
              description={t("activity.ledger_empty_desc")}
              className="min-h-36 border-0 bg-transparent p-3 sm:p-4"
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("activity.table.activity")}</TableHead>
                    <TableHead className="text-right">{t("activity.table.amount")}</TableHead>
                    <TableHead>{t("activity.table.date")}</TableHead>
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
          title={t("notifications.title")}
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
              title={t("notifications.no_notifications")}
              description={t("notifications.no_notifications_desc")}
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
