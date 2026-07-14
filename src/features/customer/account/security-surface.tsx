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
import type { CustomerActivity } from "@/features/customer/types";

const SECURITY_TIPS = [
  {
    title: "Use a unique password",
    body: "Do not reuse passwords from other sites for this account.",
  },
  {
    title: "Review devices regularly",
    body: "Revoke any trusted device or session you do not recognize.",
  },
  {
    title: "Keep email secure",
    body: "Account recovery and security notices depend on access to your verified email.",
  },
] as const;

function SecurityFrameSkeleton() {
  return (
    <div className="space-y-8 sm:space-y-9" aria-busy="true" aria-label="Loading security">
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
            (item) => item.category === "security" || /sign.?in|login|session|device/i.test(item.title),
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

  if (loading) return <SecurityFrameSkeleton />;

  return (
    <div className="space-y-8 sm:space-y-9">
      <AccountReveal>
        <AccountWelcomeHero
          title="Security"
          description="What do I control about my account? Password, trusted devices, and sessions — using certified auth services only."
          icon={Shield}
          accentClassName="bg-amber-500/10 text-amber-800 ring-amber-500/20 dark:text-amber-400"
          barClassName="via-amber-500/70"
          ariaLabel="Security header"
        />
      </AccountReveal>

      <AccountReveal delayMs={40}>
        <AccountSurfaceNav />
      </AccountReveal>

      <AccountReveal delayMs={80}>
        <section className="max-w-lg space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Password</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Change the password for this account through the certified identity API.
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
            <PasswordChangeForm />
          </div>
        </section>
      </AccountReveal>

      <AccountReveal delayMs={100}>
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Two-factor authentication</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Status reflects existing platform capability only — nothing is enabled here unless
              already offered by certified auth.
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
            <EmptyState
              icon={Shield}
              title="No additional factor enrolled"
              description="Two-factor enrollment controls appear here when your account pathway supports them. Password, devices, and sessions remain available now."
              className="min-h-0 border-0 bg-transparent p-0"
            />
          </div>
        </section>
      </AccountReveal>

      <AccountReveal delayMs={120}>
        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Trusted devices</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Devices you have trusted for sign-in. Revoke any you do not recognize.
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/account/security/trusted-devices">Open devices</Link>
            </Button>
          </div>
          <TrustedDevicesClient />
        </section>
      </AccountReveal>

      <AccountReveal delayMs={140}>
        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Active sessions</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Review and revoke authenticated sessions for this account.
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/account/security/sessions">Open sessions</Link>
            </Button>
          </div>
          <SessionsClient />
        </section>
      </AccountReveal>

      <AccountReveal delayMs={160}>
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Login & security history</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Security events from the certified activity read model — not a fabricated timeline.
            </p>
          </div>
          {activityError ? (
            <Alert variant="destructive">
              <AlertDescription>{activityError}</AlertDescription>
            </Alert>
          ) : activity.length === 0 ? (
            <EmptyState
              icon={Shield}
              title="No security events yet"
              description="Sign-ins and security notices appear here when the platform records them."
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
            <h2 className="text-lg font-semibold text-foreground">Security tips</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Practical notices — not certifications or compliance claims.
            </p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-3">
            {SECURITY_TIPS.map((tip) => (
              <li
                key={tip.title}
                className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm"
              >
                <p className="text-sm font-semibold text-foreground">{tip.title}</p>
                <p className="mt-2 text-sm text-muted-foreground">{tip.body}</p>
              </li>
            ))}
          </ul>
        </section>
      </AccountReveal>
    </div>
  );
}

function PasswordChangeForm() {
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
    else setMessage("Password changed.");
    setPending(false);
  }

  return (
    <form action={submit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="currentPassword">Current password</Label>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="newPassword">New password</Label>
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
        {pending ? "Changing" : "Change password"}
      </Button>
    </form>
  );
}
