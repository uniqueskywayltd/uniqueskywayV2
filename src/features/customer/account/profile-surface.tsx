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
import {
  getCustomerJson,
  patchCustomerJson,
  postCustomerForm,
} from "@/features/customer/api-client";
import { useI18n } from "@/features/i18n/i18n-provider";
import type { CustomerSummary } from "@/features/customer/types";

type ReferralSummary = {
  code: { code: string } | null;
};

function ProfileFrameSkeleton({ label }: { label: string }) {
  return (
    <div className="space-y-8 sm:space-y-9" aria-busy="true" aria-label={label}>
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
  const { t } = useI18n();
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
      setMessage(t("profile.updated"));
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
        setMessage(t("profile.avatar_updated"));
        await load();
      }
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : t("profile.avatar_upload_failed"),
      );
    }
    setUploading(false);
  }

  if (loading) return <ProfileFrameSkeleton label={t("profile.loading")} />;

  if (error && !summary) {
    return (
      <div className="space-y-8 sm:space-y-9">
        <AccountWelcomeHero
          title={t("profile.title")}
          description={t("profile.hero_description")}
          icon={UserRound}
          ariaLabel={t("profile.header_aria")}
        />
        <section
          className="rounded-xl border border-destructive/40 bg-destructive/5 p-6"
          role="alert"
        >
          <h2 className="text-base font-semibold text-destructive">{t("profile.unavailable")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/contact">{t("wallet.contact_support")}</Link>
          </Button>
        </section>
      </div>
    );
  }

  const profile = summary?.profile;
  const fallback = getInitials(
    profile?.legalName ?? profile?.displayName ?? summary?.user.email ?? "US",
  );

  return (
    <div className="space-y-8 sm:space-y-9">
      <AccountReveal>
        <AccountWelcomeHero
          title={t("profile.title")}
          description={t("profile.hero_description")}
          icon={UserRound}
          ariaLabel={t("profile.header_aria")}
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
              label={uploading ? t("profile.uploading") : t("profile.upload_image")}
              onFileSelected={(file) => void uploadAvatar(file)}
              {...(profile?.avatarUrl ? { imageUrl: profile.avatarUrl } : {})}
            />
            <p className="text-xs text-muted-foreground">{t("profile.compressed_hint")}</p>
            {uploading ? (
              <p className="text-sm text-muted-foreground">{t("profile.optimizing")}</p>
            ) : null}
          </div>
        </div>
      </AccountReveal>

      <AccountReveal delayMs={100}>
        <form action={submit} className="space-y-6" aria-label={t("profile.personal_info")}>
          <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {t("profile.personal_info")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("profile.personal_info_desc")}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label={t("profile.legal_name")}
                name="legalName"
                defaultValue={profile?.legalName ?? ""}
              />
              <Field
                label={t("auth.username")}
                name="displayName"
                defaultValue={profile?.displayName ?? ""}
              />
              <Field label={t("profile.phone")} name="phone" defaultValue={profile?.phone ?? ""} />
              <Field
                label={t("profile.date_of_birth")}
                name="dateOfBirth"
                type="date"
                defaultValue={profile?.dateOfBirth ?? ""}
              />
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold text-foreground">{t("profile.contact_info")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("profile.contact_info_desc")}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.email")}</Label>
                <Input id="email" value={summary?.user.email ?? ""} disabled readOnly />
              </div>
              <Field
                label={t("profile.country")}
                name="country"
                maxLength={2}
                defaultValue={profile?.country ?? ""}
              />
              <Field
                label={t("profile.state_region")}
                name="stateRegion"
                defaultValue={profile?.stateRegion ?? ""}
              />
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold text-foreground">{t("profile.account_info")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("profile.account_info_desc")}</p>
            </div>
            <dl className="grid gap-4 sm:grid-cols-2">
              <InfoRow
                label={t("profile.customer_id")}
                value={summary?.account?.accountNumber ?? "—"}
              />
              <InfoRow
                label={t("profile.account_status")}
                value={summary?.account?.status ?? "—"}
              />
              <InfoRow label={t("profile.kyc")} value={profile?.kycStatus ?? "—"} />
              <InfoRow
                label={t("profile.email_verified")}
                value={
                  summary?.user.emailVerifiedAt ? (
                    <DateDisplay value={summary.user.emailVerifiedAt} />
                  ) : (
                    t("ui.pending")
                  )
                }
              />
              <InfoRow
                label={t("profile.member_since")}
                value={
                  summary?.account?.openedAt ? (
                    <DateDisplay value={summary.account.openedAt} />
                  ) : (
                    "—"
                  )
                }
              />
              <InfoRow
                label={t("referrals.code")}
                value={
                  referralCode ? (
                    <span className="inline-flex flex-wrap items-center gap-2">
                      <span className="font-mono tracking-wide">{referralCode}</span>
                      <Button asChild variant="link" className="h-auto px-0">
                        <Link href="/account/referrals">{t("profile.open_referrals")}</Link>
                      </Button>
                    </span>
                  ) : (
                    <Button asChild variant="link" className="h-auto px-0">
                      <Link href="/account/referrals">{t("profile.view_referrals")}</Link>
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
            {pending ? t("profile.saving") : t("profile.save_changes")}
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
      <dd className="mt-1 text-sm font-medium text-foreground">{value}</dd>
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
