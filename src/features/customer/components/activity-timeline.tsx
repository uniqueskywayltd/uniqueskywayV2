"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity } from "lucide-react";

import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  EmptyState,
  Skeleton,
} from "@/components/ui";
import { DateDisplay } from "@/components/ui/display";
import { getCustomerJson } from "@/features/customer/api-client";
import type { CustomerActivity } from "@/features/customer/types";

export function ActivityTimeline() {
  const [activity, setActivity] = useState<CustomerActivity[]>([]);
  const [filter, setFilter] = useState<"all" | "financial" | "security" | "account">("all");
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    void getCustomerJson<{ activity: CustomerActivity[] }>("/api/customer/activity").then(
      (result) => {
        if (!active) return;
        if (result.error) setError(result.error);
        else setActivity(result.data?.activity ?? []);
        setLoaded(true);
      },
    );
    return () => {
      active = false;
    };
  }, []);

  const filtered =
    filter === "all" ? activity : activity.filter((item) => (item.category ?? "account") === filter);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!loaded) {
    return <Skeleton className="h-40 w-full rounded-xl" aria-label="Loading activity" />;
  }

  if (activity.length === 0) {
    return (
      <EmptyState
        icon={Activity}
        title="No activity yet"
        description="Account, security, and financial actions you take will appear here — distinct from ledger postings."
        action={
          <Button asChild variant="outline">
            <Link href="/ledger">Open ledger</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <p className="sr-only">Primary question: What have I done recently?</p>
      <div className="flex flex-wrap gap-2" aria-label="Activity filters">
        {(
          [
            ["all", "All"],
            ["financial", "Financial"],
            ["security", "Security"],
            ["account", "Account"],
          ] as const
        ).map(([id, label]) => (
          <Button
            key={id}
            type="button"
            size="sm"
            variant={filter === id ? "default" : "outline"}
            onClick={() => setFilter(id)}
          >
            {label}
          </Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/80 p-4 text-sm text-muted-foreground">
          No items in this filter. Try All.
        </p>
      ) : (
        <ul className="divide-y divide-border/70 rounded-xl border border-border/80">
          {filtered.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-4 px-4 py-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-semibold text-foreground">{item.title}</h2>
                  <Badge variant="outline">{item.category ?? item.type}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
              </div>
              <p className="shrink-0 text-xs text-muted-foreground">
                <DateDisplay value={item.createdAt} />
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
