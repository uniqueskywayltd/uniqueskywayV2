"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { UserRound } from "lucide-react";

import { Badge, Button, Skeleton } from "@/components/ui";
import { DateDisplay } from "@/components/ui/display";
import { AccountReveal } from "@/features/customer/account/account-motion";
import { AccountSurfaceNav } from "@/features/customer/account/account-surface-nav";
import { AccountWelcomeHero } from "@/features/customer/account/account-welcome-hero";
import { DashboardSignOutButton } from "@/features/customer/dashboard/dashboard-sign-out-button";
import { getCustomerJson } from "@/features/customer/api-client";
import type { CustomerSummary } from "@/features/customer/types";

function HubFrameSkeleton() {
  return (
    <div className="space-y-8 sm:space-y-9" aria-busy="true" aria-label="Loading account">
      <Skeleton className="h-36 w-full rounded-2xl sm:h-40" />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={`nav-${index}`} className="h-8 w-24 rounded-lg" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={`card-${index}`} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

/** Account hub — answers what the member controls across Profile & Security. */
export function AccountHubSurface() {
  const [summary, setSummary] = useState<CustomerSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void getCustomerJson<CustomerSummary>("/api/customer/summary").then((result) => {
      if (!active) return;
      if (result.error) setError(result.error);
      else setSummary(result.data ?? null);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <HubFrameSkeleton />;

  if (error && !summary) {
    return (
      <div className="space-y-8 sm:space-y-9">
        <AccountWelcomeHero
          title="Account"
          description="What do I control about my account? Profile, security, preferences, and sign-out."
          icon={UserRound}
          ariaLabel="Account header"
        />
        <section
          className="rounded-xl border border-destructive/40 bg-destructive/5 p-6"
          role="alert"
        >
          <h2 className="text-base font-semibold text-destructive">Account unavailable</h2>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-8 sm:space-y-9">
      <AccountReveal>
        <AccountWelcomeHero
          title="Account"
          description="What do I control about my account? Profile, security, preferences, and sign-out — money lives on Dashboard, Wallet, and Investments."
          icon={UserRound}
          ariaLabel="Account header"
        />
      </AccountReveal>

      <AccountReveal delayMs={40}>
        <AccountSurfaceNav />
      </AccountReveal>

      <AccountReveal delayMs={80}>
        <section
          className="space-y-4 rounded-2xl border border-border/60 bg-card p-6 shadow-sm"
          aria-label="Account status"
        >
          <div>
            <h2 className="text-lg font-semibold text-foreground">Account status</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Certified membership facts from your summary — not client-computed scores.
            </p>
          </div>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <InfoTile
              label="Status"
              value={
                summary?.account?.status === "active" || summary?.user.status === "active" ? (
                  <Badge variant="success">Active</Badge>
                ) : (
                  (summary?.account?.status ?? summary?.user.status ?? "—")
                )
              }
            />
            <InfoTile label="Email" value={summary?.user.email ?? "—"} />
            <InfoTile
              label="Email verified"
              value={
                summary?.user.emailVerifiedAt ? (
                  <DateDisplay value={summary.user.emailVerifiedAt} />
                ) : (
                  "Pending"
                )
              }
            />
            <InfoTile
              label="Member since"
              value={
                summary?.account?.openedAt ? <DateDisplay value={summary.account.openedAt} /> : "—"
              }
            />
            <InfoTile label="Verification (KYC)" value={summary?.profile?.kycStatus ?? "—"} />
            <InfoTile label="Customer ID" value={summary?.account?.accountNumber ?? "—"} />
          </dl>
        </section>
      </AccountReveal>

      <AccountReveal delayMs={100}>
        <section className="space-y-4" aria-label="What you can control">
          <h2 className="text-lg font-semibold text-foreground">What you can control</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <ControlLink href="/account/profile" title="Profile" body="Name, contact, avatar" />
            <ControlLink
              href="/account/security"
              title="Security"
              body="Password, devices, sessions"
            />
            <ControlLink
              href="/account/preferences"
              title="Preferences"
              body="Theme, language, notifications"
            />
            <ControlLink
              href="/account/referrals"
              title="Referrals"
              body="Invitation code (when issued)"
            />
            <ControlLink href="/dashboard" title="Dashboard" body="Your financial home" />
          </div>
        </section>
      </AccountReveal>

      <AccountReveal delayMs={120}>
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Sign out</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              End this browser session. Active sessions and trusted devices stay on Security.
            </p>
          </div>
          <DashboardSignOutButton />
        </section>
      </AccountReveal>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border border-border/50 bg-muted/20 px-4 py-3">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-medium capitalize text-foreground">{value}</dd>
    </div>
  );
}

function ControlLink({ href, title, body }: { href: string; title: string; body: string }) {
  return (
    <Button asChild variant="outline" className="h-auto justify-start px-4 py-3 text-left">
      <Link href={href}>
        <span className="block text-sm font-semibold text-foreground">{title}</span>
        <span className="mt-0.5 block text-xs font-normal text-muted-foreground">{body}</span>
      </Link>
    </Button>
  );
}
