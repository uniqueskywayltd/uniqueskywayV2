"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { Gift } from "lucide-react";
import QRCode from "qrcode";

import { Button, EmptyState, Skeleton, StatusChip } from "@/components/ui";
import type { StatusTone } from "@/components/ui/status-chip";
import { CurrencyDisplay, DateDisplay } from "@/components/ui/display";
import { getCustomerJson } from "@/features/customer/api-client";

interface ReferralHubResponse {
  northStar: string;
  understanding: string;
  code: { code: string; status: string; createdAt: string } | null;
  share: { url: string | null; text: string | null; disclaimer: string };
  guidance: Array<{ id: string; title: string; body: string }>;
  summary: {
    referralCount: number;
    qualifiedCount: number;
    pendingCount: number;
    rewardedCount: number;
    postedRewardCount: number;
    pendingRewardCount: number;
    postedRewardAmountMinor: string;
  };
  referrals: Array<{
    id: string;
    status: string;
    statusLabel: string;
    createdAt: string;
  }>;
  rewards: Array<{
    id: string;
    amountMinor: string;
    currency: string;
    status: string;
    statusLabel: string;
    createdAt: string;
    ledgerHint: string;
  }>;
  links: {
    learnHref: string;
    helpHref: string;
    ledgerHref: string;
    successHref: string;
  };
}

type StatusFilter = "all" | "pending" | "qualified" | "rewarded" | "voided";
type RewardFilter = "all" | "pending" | "posted" | "voided";

export function ReferralHub() {
  const [data, setData] = useState<ReferralHubResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copyNote, setCopyNote] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [rewardFilter, setRewardFilter] = useState<RewardFilter>("all");

  useEffect(() => {
    let active = true;
    void getCustomerJson<ReferralHubResponse>("/api/customer/referrals").then((result) => {
      if (!active) return;
      if (result.error) setError(result.error);
      else setData(result.data ?? null);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const url = data?.share.url;
    if (!url) {
      return;
    }
    void QRCode.toDataURL(url, {
      width: 180,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#0f172a", light: "#ffffff" },
    }).then((value) => {
      if (active) setQrDataUrl(value);
    });
    return () => {
      active = false;
    };
  }, [data?.share.url]);

  async function copyText(value: string, note: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopyNote(note);
    } catch {
      setCopyNote("Copy failed — select the text manually.");
    }
  }

  async function nativeShare() {
    if (!data?.share.url || !data.share.text) return;
    if (typeof navigator.share !== "function") {
      await copyText(data.share.text, "Copied invitation text.");
      return;
    }
    try {
      await navigator.share({
        title: "Unique Sky Way invitation",
        text: data.share.text,
        url: data.share.url,
      });
      setCopyNote("Share sheet opened — invite responsibly.");
    } catch {
      // User cancelled — stay quiet.
    }
  }

  if (loading) {
    return <Skeleton className="h-48 w-full rounded-xl" aria-label="Loading referrals" />;
  }

  if (error) {
    return (
      <section className="rounded-xl border border-border/80 p-6">
        <h2 className="text-base font-semibold">Referrals unavailable</h2>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/account/help/support">Request support</Link>
        </Button>
      </section>
    );
  }

  if (!data || !data.code) {
    return (
      <EmptyState
        icon={Gift}
        title="No invitation code yet"
        description="When a referral code exists on your account, you can share it calmly — never with spam tools or invented rewards."
        action={
          <Button asChild variant="outline">
            <Link href="/account/learn/referrals-responsible">Learn responsible referrals</Link>
          </Button>
        }
      />
    );
  }

  const referrals =
    statusFilter === "all"
      ? data.referrals
      : data.referrals.filter((row) => row.status === statusFilter);
  const rewards =
    rewardFilter === "all"
      ? data.rewards
      : data.rewards.filter((row) => row.status === rewardFilter);

  return (
    <div className="space-y-8">
      <p className="sr-only">Primary question: How do I recommend this platform responsibly?</p>

      <section className="rounded-xl border border-border/80 p-5 sm:p-6">
        <h2 className="text-base font-semibold">Your invitation</h2>
        <p className="mt-2 text-sm text-muted-foreground">{data.understanding}</p>
        <p className="mt-4 font-mono text-2xl font-semibold tracking-wide">{data.code.code}</p>
        <p className="mt-1 break-all text-xs text-muted-foreground">{data.share.url}</p>
        <p className="mt-2 text-xs text-muted-foreground">{data.share.disclaimer}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => void copyText(data.code!.code, "Code copied.")}
          >
            Copy code
          </Button>
          {data.share.url ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void copyText(data.share.url!, "Link copied.")}
            >
              Copy link
            </Button>
          ) : null}
          <Button type="button" size="sm" variant="outline" onClick={() => void nativeShare()}>
            Share
          </Button>
          <Button asChild size="sm" variant="ghost">
            <Link href={data.links.learnHref}>Guidance</Link>
          </Button>
        </div>
        {copyNote ? <p className="mt-2 text-sm text-muted-foreground">{copyNote}</p> : null}

        {qrDataUrl ? (
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUrl}
              alt="QR code for your responsible invitation link"
              width={180}
              height={180}
              className="rounded-md border border-border/80 bg-white p-2"
            />
            <p className="max-w-sm text-sm text-muted-foreground">
              Optional QR for in-person sharing. Same honest link — no tracking theater, no mass-invite
              tools.
            </p>
          </div>
        ) : null}
      </section>

      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Invitations" value={String(data.summary.referralCount)} />
        <Stat label="Qualified" value={String(data.summary.qualifiedCount)} />
        <Stat label="Rewarded" value={String(data.summary.rewardedCount)} />
        <Stat
          label="Credited rewards"
          valueNode={
            <CurrencyDisplay amountMinor={Number(data.summary.postedRewardAmountMinor)} />
          }
        />
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold">Referral status</h2>
          <div className="flex flex-wrap gap-2">
            {(["all", "pending", "qualified", "rewarded", "voided"] as const).map((id) => (
              <Button
                key={id}
                type="button"
                size="sm"
                variant={statusFilter === id ? "default" : "outline"}
                onClick={() => setStatusFilter(id)}
              >
                {id === "pending" ? "Registered" : id === "all" ? "All" : id}
              </Button>
            ))}
          </div>
        </div>
        {referrals.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No referral rows yet. When someone registers with your code, privacy-safe status appears
            here — never their balances.
          </p>
        ) : (
          <ul className="divide-y divide-border/70 rounded-xl border border-border/80">
            {referrals.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium">Invitation</p>
                  <p className="text-xs text-muted-foreground">
                    <DateDisplay value={row.createdAt} /> · identity hidden for privacy
                  </p>
                </div>
                <StatusChip tone={statusTone(row.status)}>{row.statusLabel}</StatusChip>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold">Rewards</h2>
          <div className="flex flex-wrap gap-2">
            {(["all", "pending", "posted", "voided"] as const).map((id) => (
              <Button
                key={id}
                type="button"
                size="sm"
                variant={rewardFilter === id ? "default" : "outline"}
                onClick={() => setRewardFilter(id)}
              >
                {id === "posted" ? "Credited" : id === "all" ? "All" : id}
              </Button>
            ))}
          </div>
        </div>
        {rewards.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No rewards yet. Credited amounts appear as ledger money when eligibility posts.
          </p>
        ) : (
          <ul className="divide-y divide-border/70 rounded-xl border border-border/80">
            {rewards.map((reward) => (
              <li key={reward.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div>
                  <CurrencyDisplay amountMinor={Number(reward.amountMinor)} />
                  <p className="text-xs text-muted-foreground">
                    <DateDisplay value={reward.createdAt} /> · {reward.ledgerHint}
                  </p>
                </div>
                <StatusChip tone={reward.status === "posted" ? "matured" : "pending"}>
                  {reward.statusLabel}
                </StatusChip>
              </li>
            ))}
          </ul>
        )}
        <Button asChild variant="link" className="h-auto px-0">
          <Link href={data.links.ledgerHref}>View ledger</Link>
        </Button>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Guidance</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {data.guidance.map((item) => (
            <li key={item.id} className="rounded-xl border border-border/80 p-4">
              <h3 className="text-sm font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline" size="sm">
            <Link href={data.links.learnHref}>Learning: responsible referrals</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href={data.links.helpHref}>Help Center</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href={data.links.successHref}>Success Hub</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  valueNode,
}: {
  label: string;
  value?: string;
  valueNode?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/80 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 text-xl font-semibold">{valueNode ?? value}</div>
    </div>
  );
}

function statusTone(status: string): StatusTone {
  if (status === "qualified" || status === "rewarded") return "matured";
  if (status === "voided") return "restricted";
  if (status === "pending") return "pending";
  return "neutral";
}
