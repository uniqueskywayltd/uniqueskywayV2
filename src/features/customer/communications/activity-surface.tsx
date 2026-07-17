"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity } from "lucide-react";

import { Alert, AlertDescription, Badge, Button, EmptyState, Skeleton } from "@/components/ui";
import { DateDisplay } from "@/components/ui/display";
import { AccountWelcomeHero } from "@/features/customer/account/account-welcome-hero";
import { CommunicationsReveal } from "@/features/customer/communications/communications-motion";
import { CommunicationsSurfaceNav } from "@/features/customer/communications/communications-surface-nav";
import { getCustomerJson } from "@/features/customer/api-client";
import { useI18n } from "@/features/i18n/i18n-provider";
import type { CustomerActivity } from "@/features/customer/types";

const FILTER_KEYS = [
  ["all", "activity.filter.all"],
  ["financial", "activity.filter.financial"],
  ["security", "activity.filter.security"],
  ["account", "activity.filter.account"],
] as const;

/** Activity timeline — certified activity read model; platform-style spine. */
export function ActivitySurface() {
  const { t } = useI18n();
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
    filter === "all"
      ? activity
      : activity.filter((item) => (item.category ?? "account") === filter);

  return (
    <div className="mx-auto max-w-3xl space-y-8 sm:space-y-9">
      <CommunicationsReveal>
        <AccountWelcomeHero
          title={t("nav.activity")}
          description={t("activity.hero_description")}
          icon={Activity}
          accentClassName="bg-indigo-500/10 text-indigo-800 ring-indigo-500/20 dark:text-indigo-400"
          barClassName="via-indigo-500/70"
          ariaLabel={t("nav.activity")}
        />
      </CommunicationsReveal>

      <CommunicationsReveal delayMs={40}>
        <CommunicationsSurfaceNav />
      </CommunicationsReveal>

      <CommunicationsReveal delayMs={80}>
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {!loaded ? (
          <div className="space-y-4" aria-busy="true" aria-label={t("ui.loading")}>
            <Skeleton className="h-10 w-full max-w-md rounded-lg" />
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>
        ) : activity.length === 0 ? (
          <EmptyState
            icon={Activity}
            title={t("activity.empty")}
            description={t("activity.empty_description")}
            action={
              <Button asChild variant="outline">
                <Link href="/ledger">{t("activity.open_ledger")}</Link>
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2" aria-label={t("nav.activity")}>
              {FILTER_KEYS.map(([id, labelKey]) => (
                <Button
                  key={id}
                  type="button"
                  size="sm"
                  variant={filter === id ? "default" : "outline"}
                  onClick={() => setFilter(id)}
                >
                  {t(labelKey)}
                </Button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border/80 p-4 text-sm text-muted-foreground">
                {t("activity.no_filter_match")}
              </p>
            ) : (
              <ol className="relative space-y-0 border-l border-border/60 pl-6" role="list">
                {filtered.map((item) => (
                  <li key={item.id} className="relative pb-8 last:pb-0">
                    <span
                      className="absolute -left-[25px] flex h-3 w-3 rounded-full bg-primary ring-4 ring-background"
                      aria-hidden
                    />
                    <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-foreground">{item.title}</p>
                            <Badge variant="outline" className="capitalize">
                              {item.category ?? item.type}
                            </Badge>
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">{item.detail}</p>
                          <p className="mt-2 text-xs text-muted-foreground">
                            <DateDisplay value={item.createdAt} />
                          </p>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
      </CommunicationsReveal>
    </div>
  );
}
