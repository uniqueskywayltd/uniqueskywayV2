"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Gift } from "lucide-react";

import { Button, EmptyState, Skeleton, StatusChip } from "@/components/ui";
import { CurrencyDisplay, DateDisplay } from "@/components/ui/display";
import { getCustomerJson } from "@/features/customer/api-client";

interface ReferralSummaryResponse {
  code: { code: string; status: string; createdAt: string } | null;
  summary: {
    referralCount: number;
    qualifiedCount: number;
    pendingCount: number;
    postedRewardCount: number;
    pendingRewardCount: number;
    postedRewardAmountMinor: string;
  };
  referrals: Array<{ id: string; status: string; createdAt: string }>;
  rewards: Array<{
    id: string;
    amountMinor: string;
    currency: string;
    status: string;
    createdAt: string;
  }>;
}

export function ReferralSummary() {
  const [data, setData] = useState<ReferralSummaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void getCustomerJson<ReferralSummaryResponse>("/api/customer/referrals").then((result) => {
      if (!active) return;
      if (result.error) setError(result.error);
      else setData(result.data ?? null);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <Skeleton className="h-48 w-full rounded-xl" aria-label="Loading referrals" />;
  }

  if (error) {
    return (
      <section className="rounded-xl border border-border/80 p-6">
        <h2 className="text-base font-semibold">Referral summary unavailable</h2>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/account/help/support">Request support</Link>
        </Button>
      </section>
    );
  }

  if (!data || (!data.code && data.summary.referralCount === 0)) {
    return (
      <EmptyState
        icon={Gift}
        title="No referral activity yet"
        description="When a referral code exists on your account, this summary reads from the frozen referral records — no invented rewards."
        action={
          <Button asChild variant="outline">
            <Link href="/account/help">Learn about referrals</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border/80 p-5">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Your code
        </p>
        <p className="mt-2 font-mono text-2xl font-semibold tracking-wide">
          {data.code?.code ?? "—"}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Posted rewards:{" "}
          <CurrencyDisplay amountMinor={Number(data.summary.postedRewardAmountMinor)} />
        </p>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Referrals" value={String(data.summary.referralCount)} />
        <Stat label="Qualified" value={String(data.summary.qualifiedCount)} />
        <Stat label="Pending rewards" value={String(data.summary.pendingRewardCount)} />
      </div>

      {data.rewards.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-base font-semibold">Recent rewards</h2>
          <ul className="divide-y divide-border/70 rounded-xl border border-border/80">
            {data.rewards.map((reward) => (
              <li key={reward.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div>
                  <CurrencyDisplay amountMinor={Number(reward.amountMinor)} />
                  <p className="text-xs text-muted-foreground">
                    <DateDisplay value={reward.createdAt} />
                  </p>
                </div>
                <StatusChip tone={reward.status === "posted" ? "matured" : "pending"}>
                  {reward.status}
                </StatusChip>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/80 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}
