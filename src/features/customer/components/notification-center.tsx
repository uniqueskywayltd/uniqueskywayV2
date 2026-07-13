"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, Search } from "lucide-react";

import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  Input,
} from "@/components/ui";
import { DateDisplay } from "@/components/ui/display";

import { getCustomerJson, postCustomerJson } from "../api-client";
import type { CustomerNotification } from "../types";

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<CustomerNotification[]>([]);
  const [query, setQuery] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const endpoint = useMemo(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("query", query.trim());
    if (unreadOnly) params.set("unreadOnly", "true");
    return `/api/customer/notifications${params.size ? `?${params.toString()}` : ""}`;
  }, [query, unreadOnly]);

  useEffect(() => {
    let active = true;
    void getCustomerJson<{ notifications: CustomerNotification[]; unreadCount: number }>(
      endpoint,
    ).then((result) => {
      if (!active) return;
      if (result.error) setError(result.error);
      else {
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
    if (result.error) setError(result.error);
    else {
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId
            ? { ...notification, readAt: new Date().toISOString() }
            : notification,
        ),
      );
      setUnreadCount((current) => Math.max(0, current - 1));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
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
          {unreadCount > 0 ? <Badge variant="secondary">{unreadCount}</Badge> : null}
        </Button>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {loaded && notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="Account updates will appear here."
        />
      ) : null}

      <div className="space-y-3">
        {notifications.map((notification) => (
          <Card key={notification.id}>
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-semibold">{notification.title}</h2>
                  {!notification.readAt ? <Badge variant="info">Unread</Badge> : null}
                  <Badge variant="outline">{notification.priority}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{notification.body}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  <DateDisplay value={notification.createdAt} />
                </p>
              </div>
              {!notification.readAt ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void markRead(notification.id)}
                >
                  Mark read
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
