"use client";

import { useEffect, useState } from "react";
import { Activity } from "lucide-react";

import { Alert, AlertDescription, Badge, Card, CardContent, EmptyState } from "@/components/ui";
import { DateDisplay } from "@/components/ui/display";

import { getCustomerJson } from "../api-client";
import type { CustomerActivity } from "../types";

export function ActivityTimeline() {
  const [activity, setActivity] = useState<CustomerActivity[]>([]);
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

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (loaded && activity.length === 0) {
    return (
      <EmptyState
        icon={Activity}
        title="No activity yet"
        description="Security and account events will appear here."
      />
    );
  }

  return (
    <div className="space-y-3">
      {activity.map((item) => (
        <Card key={item.id}>
          <CardContent className="flex items-start justify-between gap-4 p-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold">{item.title}</h2>
                <Badge variant="outline">{item.type}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
            </div>
            <p className="shrink-0 text-xs text-muted-foreground">
              <DateDisplay value={item.createdAt} />
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
