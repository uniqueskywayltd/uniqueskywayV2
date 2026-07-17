"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Monitor, Shield, Smartphone, Tablet } from "lucide-react";

import {
  Alert,
  AlertDescription,
  Button,
  EmptyState,
  Input,
  Label,
  Skeleton,
} from "@/components/ui";
import { DateDisplay } from "@/components/ui/display";
import { AccountReveal } from "@/features/customer/account/account-motion";
import { AccountSurfaceNav } from "@/features/customer/account/account-surface-nav";
import { AccountWelcomeHero } from "@/features/customer/account/account-welcome-hero";
import {
  SessionsClient,
  TrustedDevicesClient,
} from "@/features/auth/components/security-management";
import { getCustomerJson, postCustomerJson } from "@/features/customer/api-client";
import { useI18n } from "@/features/i18n/i18n-provider";
import type { CustomerActivity } from "@/features/customer/types";

const SECURITY_TIP_KEYS = [
  { titleKey: "security.tip_unique_password_title", bodyKey: "security.tip_unique_password_body" },
  { titleKey: "security.tip_review_devices_title", bodyKey: "security.tip_review_devices_body" },
  { titleKey: "security.tip_email_title", bodyKey: "security.tip_email_body" },
] as const;

function SecurityFrameSkeleton({ label }: { label: string }) {
  return (
    <div className="space-y-8 sm:space-y-9" aria-busy="true" aria-label={label}>
      <Skeleton className="h-36 w-full rounded-2xl sm:h-40" />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={`nav-${index}`} className="h-8 w-24 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-56 w-full max-w-lg rounded-2xl" />
      <Skeleton className="h-48 w-full rounded-2xl" />
    </div>
  );
}

function DeviceIcon({ detail }: { detail: string }) {
  if (/mobile/i.test(detail)) return <Smartphone className="h-5 w-5" aria-hidden />;
  if (/tablet|ipad/i.test(detail)) return <Tablet className="h-5 w-5" aria-hidden />;
  return <Monitor className="h-5 w-5" aria-hidden />;
}

/** Security surface — password, devices, sessions, certified security activity. */
export function SecuritySurface() {
  const { t } = useI18n();
  const [activity, setActivity] = useState<CustomerActivity[]>([]);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void getCustomerJson<{ activity: CustomerActivity[] }>("/api/customer/activity").then(
      (result) => {
        if (!active) return;
        if (result.error) setActivityError(result.error);
        else {
          const rows = (result.data?.activity ?? []).filter(
            (item) =>
              item.category === "security" || /sign.?in|login|session|device/i.test(item.title),
          );
          setActivity(rows.slice(0, 12));
        }
        setLoading(false);
      },
    );
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <SecurityFrameSkeleton label={t("security.loading")} />;

  return (
    <div className="space-y-8 sm:space-y-9">
      <AccountReveal>
        <AccountWelcomeHero
          title={t("profile.security")}
          description={t("security.hero_description")}
          icon={Shield}
          accentClassName="bg-amber-500/10 text-amber-800 ring-amber-500/20 dark:text-amber-400"
          barClassName="via-amber-500/70"
          ariaLabel={t("security.header_aria")}
        />
      </AccountReveal>

      <AccountReveal delayMs={40}>
        <AccountSurfaceNav />
      </AccountReveal>

      <AccountReveal delayMs={80}>
        <section className="max-w-lg space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{t("security.password")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("security.password_desc")}</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
            <PasswordChangeForm />
          </div>
        </section>
      </AccountReveal>

      <AccountReveal delayMs={100}>
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{t("security.two_factor")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("security.two_factor_desc")}</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
            <EmptyState
              icon={Shield}
              title={t("security.no_2fa")}
              description={t("security.no_2fa_desc")}
              className="min-h-0 border-0 bg-transparent p-0"
            />
          </div>
        </section>
      </AccountReveal>

      <AccountReveal delayMs={120}>
        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {t("security.trusted_devices")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("security.trusted_devices_desc")}
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/account/security/trusted-devices">{t("security.open_devices")}</Link>
            </Button>
          </div>
          <TrustedDevicesClient />
        </section>
      </AccountReveal>

      <AccountReveal delayMs={140}>
        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {t("security.active_sessions")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("security.active_sessions_desc")}
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/account/security/sessions">{t("security.open_sessions")}</Link>
            </Button>
          </div>
          <SessionsClient />
        </section>
      </AccountReveal>

      <AccountReveal delayMs={160}>
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{t("security.history")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("security.history_desc")}</p>
          </div>
          {activityError ? (
            <Alert variant="destructive">
              <AlertDescription>{activityError}</AlertDescription>
            </Alert>
          ) : activity.length === 0 ? (
            <EmptyState
              icon={Shield}
              title={t("security.no_events")}
              description={t("security.no_events_desc")}
            />
          ) : (
            <ul className="space-y-3">
              {activity.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center gap-4 rounded-xl border border-border/60 bg-card p-4 shadow-sm"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <DeviceIcon detail={`${entry.title} ${entry.detail}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{entry.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {entry.detail} · <DateDisplay value={entry.createdAt} />
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </AccountReveal>

      <AccountReveal delayMs={180}>
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{t("security.tips")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("security.tips_desc")}</p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-3">
            {SECURITY_TIP_KEYS.map((tip) => (
              <li
                key={tip.titleKey}
                className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm"
              >
                <p className="text-sm font-semibold text-foreground">{t(tip.titleKey)}</p>
                <p className="mt-2 text-sm text-muted-foreground">{t(tip.bodyKey)}</p>
              </li>
            ))}
          </ul>
        </section>
      </AccountReveal>
    </div>
  );
}

function PasswordChangeForm() {
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(formData: FormData) {
    setPending(true);
    setError(null);
    setMessage(null);

    const result = await postCustomerJson("/api/auth/password/change", {
      currentPassword: String(formData.get("currentPassword") ?? ""),
      newPassword: String(formData.get("newPassword") ?? ""),
    });

    if (result.error) setError(result.error);
    else setMessage(t("security.changed"));
    setPending(false);
  }

  return (
    <form action={submit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="currentPassword">{t("security.current_password")}</Label>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="newPassword">{t("security.new_password")}</Label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
        />
      </div>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {message ? (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? t("security.changing") : t("security.change_password")}
      </Button>
    </form>
  );
}
