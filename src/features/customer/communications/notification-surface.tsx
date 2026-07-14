"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Search } from "lucide-react";

import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  EmptyState,
  Input,
  Skeleton,
  StatusChip,
} from "@/components/ui";
import { DateDisplay } from "@/components/ui/display";
import { AccountWelcomeHero } from "@/features/customer/account/account-welcome-hero";
import { CommunicationsReveal } from "@/features/customer/communications/communications-motion";
import { CommunicationsSurfaceNav } from "@/features/customer/communications/communications-surface-nav";
import { getCustomerJson, postCustomerJson } from "@/features/customer/api-client";
import type { CustomerNotification } from "@/features/customer/types";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "financial", label: "Financial" },
  { id: "security", label: "Security" },
  { id: "system", label: "System" },
] as const;

/** Notification Center — certified notifications read model only. */
export function NotificationSurface() {
  const [notifications, setNotifications] = useState<CustomerNotification[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]["id"]>("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const endpoint = useMemo(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("query", query.trim());
    if (unreadOnly) params.set("unreadOnly", "true");
    if (category !== "all") params.set("category", category);
    return `/api/customer/notifications${params.size ? `?${params.toString()}` : ""}`;
  }, [query, unreadOnly, category]);

  useEffect(() => {
    let active = true;
    void getCustomerJson<{ notifications: CustomerNotification[]; unreadCount: number }>(
      endpoint,
    ).then((result) => {
      if (!active) return;
      if (result.error) setError(result.error);
      else {
        setError(null);
        setNotifications(result.data?.notifications ?? []);
        setUnreadCount(result.data?.unreadCount ?? 0);
      }
      setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, [endpoint]);

  async function markRead(notificationId: string) {
    const result = await postCustomerJson("/api/customer/notifications/read", { notificationId });
    if (result.error) {
      setError(result.error);
      return;
    }
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId
          ? { ...notification, readAt: new Date().toISOString() }
          : notification,
      ),
    );
    setUnreadCount((current) => Math.max(0, current - 1));
  }

  async function markAllRead() {
    setMarkingAll(true);
    const result = await postCustomerJson<{ updatedCount?: number }>(
      "/api/customer/notifications/read",
      { markAll: true },
    );
    setMarkingAll(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        readAt: notification.readAt ?? new Date().toISOString(),
      })),
    );
    setUnreadCount(0);
  }

  const today = notifications.filter((item) => item.isToday);
  const earlier = notifications.filter((item) => !item.isToday);

  return (
    <div className="mx-auto max-w-3xl space-y-8 sm:space-y-9">
      <CommunicationsReveal>
        <AccountWelcomeHero
          title="Notifications"
          description="What do I need to know right now? Security first, then money that needs attention, then system updates."
          icon={Bell}
          accentClassName="bg-rose-500/10 text-rose-800 ring-rose-500/20 dark:text-rose-400"
          barClassName="via-rose-500/70"
          ariaLabel="Notifications header"
        />
      </CommunicationsReveal>

      <CommunicationsReveal delayMs={40}>
        <CommunicationsSurfaceNav />
      </CommunicationsReveal>

      <CommunicationsReveal delayMs={80}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="notification-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search notifications"
              className="pl-9"
              aria-label="Search notifications"
            />
          </div>
          <Button
            type="button"
            variant={unreadOnly ? "default" : "outline"}
            onClick={() => setUnreadOnly((value) => !value)}
          >
            Unread
            {unreadCount > 0 ? (
              <Badge variant="secondary" className="ml-1 tabular-nums">
                {unreadCount}
              </Badge>
            ) : null}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={markingAll || unreadCount === 0}
            onClick={() => void markAllRead()}
          >
            <CheckCheck className="mr-2 h-4 w-4" aria-hidden />
            {markingAll ? "Marking…" : "Mark all read"}
          </Button>
        </div>

        <div
          className="mt-4 flex flex-wrap gap-2"
          role="tablist"
          aria-label="Notification categories"
        >
          {CATEGORIES.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={category === item.id}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                category === item.id
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
              onClick={() => setCategory(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <p className="mt-3 text-sm text-muted-foreground">
          Priority: Security → money failures → money success → system.{" "}
          <Link href="/account/preferences" className="underline underline-offset-2">
            Notification preferences
          </Link>
        </p>
      </CommunicationsReveal>

      <CommunicationsReveal delayMs={100}>
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {!loaded ? (
          <div className="space-y-3" aria-busy="true" aria-label="Loading notifications">
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="You're all caught up"
            description="Financial, security, and system updates appear here when something needs your attention."
            action={
              <Button asChild variant="outline">
                <Link href="/account/help">Open Help Center</Link>
              </Button>
            }
          />
        ) : (
          <div className="space-y-6" aria-live="polite">
            <NotificationGroup title="Today" items={today} onMarkRead={markRead} />
            <NotificationGroup title="Earlier" items={earlier} onMarkRead={markRead} />
          </div>
        )}
      </CommunicationsReveal>
    </div>
  );
}

function NotificationGroup({
  title,
  items,
  onMarkRead,
}: {
  title: string;
  items: CustomerNotification[];
  onMarkRead: (id: string) => Promise<void>;
}) {
  if (items.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </h2>
      <ul className="space-y-2" role="list">
        {items.map((notification) => {
          const unread = !notification.readAt;
          return (
            <li
              key={notification.id}
              className={cn(
                "rounded-lg border border-border/60 bg-card px-4 py-3 shadow-sm",
                unread && "border-l-2 border-l-primary",
              )}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-sm font-semibold text-foreground">
                      {notification.title}
                    </h3>
                    {unread ? <Badge variant="info">Unread</Badge> : null}
                    <StatusChip tone={priorityTone(notification.priority)}>
                      {notification.priority}
                    </StatusChip>
                    {notification.category ? (
                      <Badge variant="outline" className="capitalize">
                        {notification.category}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-sm text-muted-foreground">{notification.body}</p>
                  <p className="text-xs text-muted-foreground">
                    <DateDisplay value={notification.createdAt} />
                  </p>
                  {notification.href ? (
                    <Button asChild variant="link" className="h-auto px-0">
                      <Link href={notification.href}>Open related item</Link>
                    </Button>
                  ) : null}
                </div>
                {unread ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="shrink-0"
                    onClick={() => void onMarkRead(notification.id)}
                  >
                    Read
                  </Button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function priorityTone(priority: string) {
  if (priority === "critical" || priority === "warning") return "restricted" as const;
  if (priority === "success") return "matured" as const;
  return "pending" as const;
}
