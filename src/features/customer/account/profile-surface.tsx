"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { UserRound } from "lucide-react";

import {
  Alert,
  AlertDescription,
  Button,
  Input,
  Label,
  ProfileImageUploader,
  Skeleton,
} from "@/components/ui";
import { DateDisplay } from "@/components/ui/display";
import { compressAvatarToWebp } from "@/features/customer/account/avatar-compress";
import { AccountReveal } from "@/features/customer/account/account-motion";
import { AccountSurfaceNav } from "@/features/customer/account/account-surface-nav";
import { AccountWelcomeHero } from "@/features/customer/account/account-welcome-hero";
import { getCustomerJson, patchCustomerJson, postCustomerForm } from "@/features/customer/api-client";
import type { CustomerSummary } from "@/features/customer/types";

type ReferralSummary = {
  code: { code: string } | null;
};

function ProfileFrameSkeleton() {
  return (
    <div className="space-y-8 sm:space-y-9" aria-busy="true" aria-label="Loading profile">
      <Skeleton className="h-36 w-full rounded-2xl sm:h-40" />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={`nav-${index}`} className="h-8 w-24 rounded-lg" />
        ))}
      </div>
      <Skeleton className="mx-auto h-28 w-28 rounded-full" />
      <Skeleton className="h-64 w-full rounded-2xl" />
      <Skeleton className="h-48 w-full rounded-2xl" />
    </div>
  );
}

/** Profile surface — certified summary + profile/avatar APIs only. */
export function ProfileSurface() {
  const [summary, setSummary] = useState<CustomerSummary | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    const [summaryResult, referralResult] = await Promise.all([
      getCustomerJson<CustomerSummary>("/api/customer/summary"),
      getCustomerJson<ReferralSummary>("/api/customer/referrals"),
    ]);
    if (summaryResult.error) setError(summaryResult.error);
    else {
      setError(null);
      setSummary(summaryResult.data ?? null);
    }
    if (!referralResult.error) {
      setReferralCode(referralResult.data?.code?.code ?? null);
    }
  }

  useEffect(() => {
    let active = true;
    void Promise.all([
      getCustomerJson<CustomerSummary>("/api/customer/summary"),
      getCustomerJson<ReferralSummary>("/api/customer/referrals"),
    ]).then(([summaryResult, referralResult]) => {
      if (!active) return;
      if (summaryResult.error) setError(summaryResult.error);
      else setSummary(summaryResult.data ?? null);
      if (!referralResult.error) setReferralCode(referralResult.data?.code?.code ?? null);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  async function submit(formData: FormData) {
    setPending(true);
    setError(null);
    setMessage(null);

    const result = await patchCustomerJson("/api/customer/profile", {
      legalName: String(formData.get("legalName") ?? ""),
      displayName: String(formData.get("displayName") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      country: String(formData.get("country") ?? "").toUpperCase(),
      stateRegion: String(formData.get("stateRegion") ?? ""),
      dateOfBirth: String(formData.get("dateOfBirth") ?? ""),
    });

    if (result.error) setError(result.error);
    else {
      setMessage("Profile updated.");
      await load();
    }
    setPending(false);
  }

  async function uploadAvatar(file: File) {
    setUploading(true);
    setError(null);
    setMessage(null);
    try {
      const webp = await compressAvatarToWebp(file);
      const formData = new FormData();
      formData.set("avatar", webp, "avatar.webp");
      const result = await postCustomerForm("/api/customer/avatar", formData);
      if (result.error) setError(result.error);
      else {
        setMessage("Avatar updated.");
        await load();
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Avatar upload failed.");
    }
    setUploading(false);
  }

  if (loading) return <ProfileFrameSkeleton />;

  if (error && !summary) {
    return (
      <div className="space-y-8 sm:space-y-9">
        <AccountWelcomeHero
          title="Profile"
          description="What do I control about my account? Identity details you can update — not balances or investments."
          icon={UserRound}
          ariaLabel="Profile header"
        />
        <section className="rounded-xl border border-destructive/40 bg-destructive/5 p-6" role="alert">
          <h2 className="text-base font-semibold text-destructive">Profile unavailable</h2>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/contact">Contact support</Link>
          </Button>
        </section>
      </div>
    );
  }

  const profile = summary?.profile;
  const fallback = getInitials(
    profile?.displayName ?? profile?.legalName ?? summary?.user.email ?? "US",
  );

  return (
    <div className="space-y-8 sm:space-y-9">
      <AccountReveal>
        <AccountWelcomeHero
          title="Profile"
          description="What do I control about my account? Identity details you can update — not balances or investments."
          icon={UserRound}
          ariaLabel="Profile header"
        />
      </AccountReveal>

      <AccountReveal delayMs={40}>
        <AccountSurfaceNav />
      </AccountReveal>

      <AccountReveal delayMs={80}>
        <div className="flex justify-center">
          <div className="w-full max-w-xs space-y-3 text-center">
            <ProfileImageUploader
              fallback={fallback}
              label={uploading ? "Uploading" : "Upload image"}
              onFileSelected={(file) => void uploadAvatar(file)}
              {...(profile?.avatarUrl ? { imageUrl: profile.avatarUrl } : {})}
            />
            <p className="text-xs text-muted-foreground">Compressed to WebP before upload.</p>
            {uploading ? <p className="text-sm text-muted-foreground">Optimizing image…</p> : null}
          </div>
        </div>
      </AccountReveal>

      <AccountReveal delayMs={100}>
        <form
          action={submit}
          className="space-y-6"
          aria-label="Personal information"
        >
          <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Personal information</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Keep legal and display names current for your account.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Legal name" name="legalName" defaultValue={profile?.legalName ?? ""} />
              <Field
                label="Display name"
                name="displayName"
                defaultValue={profile?.displayName ?? ""}
              />
              <Field label="Phone" name="phone" defaultValue={profile?.phone ?? ""} />
              <Field
                label="Date of birth"
                name="dateOfBirth"
                type="date"
                defaultValue={profile?.dateOfBirth ?? ""}
              />
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Contact information</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Email is managed by sign-in. Location fields stay on your profile record.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={summary?.user.email ?? ""} disabled readOnly />
              </div>
              <Field
                label="Country"
                name="country"
                maxLength={2}
                defaultValue={profile?.country ?? ""}
              />
              <Field
                label="State / region"
                name="stateRegion"
                defaultValue={profile?.stateRegion ?? ""}
              />
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Account information</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Certified account facts — status and membership dates from the platform.
              </p>
            </div>
            <dl className="grid gap-4 sm:grid-cols-2">
              <InfoRow label="Account number" value={summary?.account?.accountNumber ?? "—"} />
              <InfoRow label="Account status" value={summary?.account?.status ?? "—"} />
              <InfoRow label="Verification (KYC)" value={profile?.kycStatus ?? "—"} />
              <InfoRow
                label="Email verified"
                value={
                  summary?.user.emailVerifiedAt ? (
                    <DateDisplay value={summary.user.emailVerifiedAt} />
                  ) : (
                    "Pending"
                  )
                }
              />
              <InfoRow
                label="Member since"
                value={
                  summary?.account?.openedAt ? (
                    <DateDisplay value={summary.account.openedAt} />
                  ) : (
                    "—"
                  )
                }
              />
              <InfoRow
                label="Referral code"
                value={
                  referralCode ? (
                    <span className="inline-flex flex-wrap items-center gap-2">
                      <span className="font-mono tracking-wide">{referralCode}</span>
                      <Button asChild variant="link" className="h-auto px-0">
                        <Link href="/account/referrals">Open referrals</Link>
                      </Button>
                    </span>
                  ) : (
                    <Button asChild variant="link" className="h-auto px-0">
                      <Link href="/account/referrals">View referrals</Link>
                    </Button>
                  )
                }
              />
            </dl>
          </section>

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
            {pending ? "Saving" : "Save changes"}
          </Button>
        </form>
      </AccountReveal>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  maxLength,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue: string;
  maxLength?: number;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} defaultValue={defaultValue} maxLength={maxLength} />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border border-border/50 bg-muted/20 px-4 py-3">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-foreground capitalize">{value}</dd>
    </div>
  );
}

function getInitials(value: string): string {
  return (
    value
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "US"
  );
}
