"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { DateDisplay } from "@/components/ui/display";

import { getCustomerJson } from "../api-client";
import type { CustomerSummary } from "../types";

export function AccountOverview() {
  const [summary, setSummary] = useState<CustomerSummary | null>(null);

  useEffect(() => {
    let active = true;
    void getCustomerJson<CustomerSummary>("/api/customer/summary").then((result) => {
      if (active && result.data) setSummary(result.data);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Account foundation</CardTitle>
          <CardDescription>
            Your profile, security, and preferences are ready for future financial modules.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <SummaryItem label="Account status" value={summary?.account?.status ?? "Active"} />
          <SummaryItem label="Email" value={summary?.user.email ?? "Loading"} />
          <SummaryItem
            label="Email verified"
            value={
              summary?.user.emailVerifiedAt ? (
                <DateDisplay value={summary.user.emailVerifiedAt} />
              ) : (
                "Pending"
              )
            }
          />
          <SummaryItem
            label="Unread notifications"
            value={String(summary?.unreadNotificationCount ?? 0)}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Next steps</CardTitle>
          <CardDescription>Complete your account experience.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button asChild variant="outline" className="w-full justify-start">
            <Link href="/account/communications">Communication Center</Link>
          </Button>
          <Button asChild variant="outline" className="w-full justify-start">
            <Link href="/account/notifications">Notifications</Link>
          </Button>
          <Button asChild variant="outline" className="w-full justify-start">
            <Link href="/account/help">Help Center</Link>
          </Button>
          <Button asChild variant="outline" className="w-full justify-start">
            <Link href="/account/profile">Update profile</Link>
          </Button>
          <Button asChild variant="outline" className="w-full justify-start">
            <Link href="/account/security">Review security</Link>
          </Button>
          <Button asChild variant="outline" className="w-full justify-start">
            <Link href="/account/preferences">Set preferences</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md border p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-2 text-sm font-medium">
        {typeof value === "string" && ["Active", "active"].includes(value) ? (
          <Badge variant="success">Active</Badge>
        ) : (
          value
        )}
      </div>
    </div>
  );
}
