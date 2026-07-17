"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Dialog as DialogPrimitive } from "radix-ui";
import { Info } from "lucide-react";

import { Alert, AlertDescription, Button, Skeleton } from "@/components/ui";
import { CurrencyDisplay } from "@/components/ui/display";
import { MoneyAmountInput } from "@/components/ui/money-amount-input";
import { getCustomerJson, postCustomerJson } from "@/features/customer/api-client";
import { formatCountdown } from "@/features/customer/portfolio/use-live-accrual";
import { appPath } from "@/lib/app-path";
import {
  formatMoneyInputDisplay,
  formatMoneyMinorUnits,
  parsePositiveMoneyInputToMinorBigInt,
} from "@/lib/money-format";
import { secondsUntilNextNewYorkMidnight } from "@/domains/settlement/new-york-calendar";
import { cn } from "@/lib/utils";

type PublishedPlan = {
  planId: string;
  planVersionId: string;
  slug: string;
  name: string;
  description: string | null;
  currency: string;
  minPrincipalMinor: string;
  maxPrincipalMinor: string;
  termDays: number;
  dailyRoiBps: number;
  totalRoiBps: number | null;
  earlyExitPolicy?: string;
  earlyExitPenaltyBps?: number;
};

type WalletBalances = {
  availableBalanceMinor: string;
  lockedBalanceMinor?: string;
  reservedBalanceMinor?: string;
  currency: string;
};

type ActivationSuccess = {
  investmentId: string;
  planName: string;
  amountLabel: string;
  dailyRoiLabel: string;
  dailyEarningsLabel: string;
  expectedRoiLabel: string;
  maturityLabel: string;
};

const PLAN_BEST_FOR: Record<string, string> = {
  silver: "Getting started with shorter cycles",
  gold: "Balanced growth over one week",
  classic: "Stronger returns with a longer term",
  master: "Maximum commitment and elite returns",
};

function dailyRoiLabel(bps: number): string {
  return `${(bps / 100).toFixed(2)}%`;
}

function formatMaturityLabel(termDays: number, now = new Date()): string {
  const maturity = new Date(now.getTime() + termDays * 86_400_000);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(maturity);
}

function minorToMajorInput(amountMinor: bigint): string {
  const negative = amountMinor < 0n;
  const absolute = negative ? -amountMinor : amountMinor;
  const whole = absolute / 100n;
  const fraction = (absolute % 100n).toString().padStart(2, "0");
  const body = `${whole.toString()}.${fraction}`;
  return negative ? `-${body}` : body;
}

function presentActivationError(message: string | undefined, reference?: string): string {
  const raw = (message ?? "").trim();
  const lower = raw.toLowerCase();
  let text = "Unable to activate your investment at this time.";
  if (
    lower.includes("insufficient available balance") ||
    lower.includes("available balance is insufficient")
  ) {
    text = "Insufficient available balance.";
  } else if (lower.includes("below the minimum")) {
    text = "Investment amount is below the minimum.";
  } else if (lower.includes("exceeds this plan") || lower.includes("outside the investment plan")) {
    text = "Investment amount exceeds this plan's maximum.";
  } else if (
    raw &&
    !lower.includes("couldn't complete") &&
    !lower.includes("unable to complete") &&
    !lower.includes("unable to activate")
  ) {
    text = raw;
  }
  if (reference) return `${text}\n\nReference:\n${reference}`;
  return text;
}

/** Activate an investment from available wallet balance using certified plan versions. */
export function ActivateInvestmentSurface() {
  const router = useRouter();
  const submittingRef = useRef(false);
  const [plans, setPlans] = useState<PublishedPlan[]>([]);
  const [availableMinor, setAvailableMinor] = useState<bigint>(0n);
  const [lockedMinor, setLockedMinor] = useState<bigint>(0n);
  const [reservedMinor, setReservedMinor] = useState<bigint>(0n);
  const [currency, setCurrency] = useState("USD");
  const [planVersionId, setPlanVersionId] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState<ActivationSuccess | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    let active = true;
    void Promise.all([
      getCustomerJson<{ plans: PublishedPlan[] }>("/api/customer/investments?catalog=plans"),
      getCustomerJson<{ balances: WalletBalances }>("/api/customer/wallet"),
    ]).then(([plansResult, walletResult]) => {
      if (!active) return;
      if (plansResult.error || walletResult.error) {
        setError(plansResult.error ?? walletResult.error ?? "Unable to load activation data.");
        setLoading(false);
        return;
      }
      const nextPlans = plansResult.data?.plans ?? [];
      setPlans(nextPlans);
      const featured = nextPlans.find((plan) => plan.slug === "gold") ?? nextPlans[0] ?? null;
      if (featured) setPlanVersionId(featured.planVersionId);
      const balances = walletResult.data?.balances;
      setAvailableMinor(BigInt(balances?.availableBalanceMinor ?? "0"));
      setLockedMinor(BigInt(balances?.lockedBalanceMinor ?? "0"));
      setReservedMinor(BigInt(balances?.reservedBalanceMinor ?? "0"));
      setCurrency(balances?.currency ?? "USD");
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const selected = useMemo(
    () => plans.find((plan) => plan.planVersionId === planVersionId) ?? null,
    [plans, planVersionId],
  );

  const principalMinor = useMemo(() => parsePositiveMoneyInputToMinorBigInt(amount), [amount]);

  const liveSummary = useMemo(() => {
    if (!selected || principalMinor == null) return null;
    const dailyEarningsMinor = (principalMinor * BigInt(selected.dailyRoiBps)) / 10_000n;
    const expectedRoiMinor =
      selected.totalRoiBps != null
        ? (principalMinor * BigInt(selected.totalRoiBps)) / 10_000n
        : dailyEarningsMinor * BigInt(selected.termDays);
    const maturityValueMinor = principalMinor + expectedRoiMinor;
    return {
      dailyEarningsMinor,
      expectedRoiMinor,
      maturityValueMinor,
      maturityLabel: formatMaturityLabel(selected.termDays, new Date(nowMs)),
      nextCredit: formatCountdown(secondsUntilNextNewYorkMidnight(new Date(nowMs))),
    };
  }, [selected, principalMinor, nowMs]);

  function fillMin() {
    if (!selected) return;
    setAmount(formatMoneyInputDisplay(minorToMajorInput(BigInt(selected.minPrincipalMinor))));
  }

  function fillMax() {
    if (!selected) return;
    const planMax = BigInt(selected.maxPrincipalMinor);
    const maxInvestable = availableMinor < planMax ? availableMinor : planMax;
    if (maxInvestable <= 0n) {
      setError("Insufficient available balance.");
      return;
    }
    setAmount(formatMoneyInputDisplay(minorToMajorInput(maxInvestable)));
  }

  async function submit() {
    if (!selected || submittingRef.current) return;
    if (principalMinor === null) {
      setError("Enter a valid USD amount.");
      return;
    }
    if (principalMinor < BigInt(selected.minPrincipalMinor)) {
      setError("Investment amount is below the minimum.");
      return;
    }
    if (principalMinor > BigInt(selected.maxPrincipalMinor)) {
      setError("Investment amount exceeds this plan's maximum.");
      return;
    }
    if (principalMinor > availableMinor) {
      setError("Insufficient available balance.");
      return;
    }

    submittingRef.current = true;
    setPending(true);
    setError(null);

    const result = await postCustomerJson<{ investment: { id: string } }>(
      "/api/customer/investments",
      {
        planVersionId: selected.planVersionId,
        principalMinor: principalMinor.toString(),
        idempotencyKey: `activate:${selected.planVersionId}:${principalMinor}`,
      },
    );

    if (result.error) {
      setError(presentActivationError(result.error, result.reference));
      setPending(false);
      submittingRef.current = false;
      return;
    }

    const investmentId = result.data?.investment.id;
    if (!investmentId) {
      setError(presentActivationError(undefined));
      setPending(false);
      submittingRef.current = false;
      return;
    }

    const dailyEarningsMinor = (principalMinor * BigInt(selected.dailyRoiBps)) / 10_000n;
    const expectedRoiMinor =
      selected.totalRoiBps != null
        ? (principalMinor * BigInt(selected.totalRoiBps)) / 10_000n
        : dailyEarningsMinor * BigInt(selected.termDays);

    setSuccess({
      investmentId,
      planName: selected.name,
      amountLabel: formatMoneyMinorUnits("en", principalMinor, currency),
      dailyRoiLabel: dailyRoiLabel(selected.dailyRoiBps),
      dailyEarningsLabel: formatMoneyMinorUnits("en", dailyEarningsMinor, currency),
      expectedRoiLabel: formatMoneyMinorUnits("en", expectedRoiMinor, currency),
      maturityLabel: formatMaturityLabel(selected.termDays),
    });
    setPending(false);
  }

  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading activation">
        <Skeleton className="h-10 w-72 rounded-md" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 sm:space-y-8">
      <header className="space-y-2">
        <h1 className="font-heading text-3xl tracking-tight text-foreground sm:text-4xl">
          Start Your Investment
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Choose an investment plan and begin earning daily returns from your available wallet
          balance.
        </p>
      </header>

      <section
        aria-label="Available balance"
        className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/12 via-card to-card p-6 shadow-[var(--elevation-2)] sm:p-7"
      >
        <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">
          Wallet Balance
        </p>
        <p className="mt-2 font-heading text-4xl font-semibold tracking-tight text-foreground tabular-nums sm:text-5xl">
          <CurrencyDisplay amountMinor={Number(availableMinor)} currency={currency} />
        </p>
        <p className="mt-2 text-sm font-medium text-muted-foreground">Available to Invest</p>
        {(lockedMinor > 0n || reservedMinor > 0n) && (
          <p className="mt-3 text-xs text-muted-foreground">
            {lockedMinor > 0n ? (
              <>
                Locked in investments:{" "}
                <CurrencyDisplay amountMinor={Number(lockedMinor)} currency={currency} />
              </>
            ) : null}
            {lockedMinor > 0n && reservedMinor > 0n ? " · " : null}
            {reservedMinor > 0n ? (
              <>
                Reserved for withdrawals:{" "}
                <CurrencyDisplay amountMinor={Number(reservedMinor)} currency={currency} />
              </>
            ) : null}
          </p>
        )}
      </section>

      {plans.length === 0 ? (
        <Alert>
          <AlertDescription>
            No published investment plans are available yet. Deposit funds and check back after
            plans are published.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div className="space-y-5">
            <section aria-label="Investment plans" className="space-y-3">
              <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                Choose a plan
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {plans.map((plan) => {
                  const selectedPlan = plan.planVersionId === planVersionId;
                  const recommended = plan.slug === "gold";
                  return (
                    <button
                      key={plan.planVersionId}
                      type="button"
                      disabled={pending}
                      onClick={() => setPlanVersionId(plan.planVersionId)}
                      className={cn(
                        "relative rounded-2xl border bg-card p-4 text-left shadow-sm",
                        "motion-safe:transition-[border-color,box-shadow,transform] motion-safe:duration-200 motion-reduce:transition-none",
                        selectedPlan
                          ? "border-primary shadow-[var(--elevation-2)] ring-2 ring-primary/30"
                          : "border-border/70 hover:border-primary/30 motion-safe:hover:-translate-y-0.5",
                      )}
                    >
                      {recommended ? (
                        <span className="absolute top-3 right-3 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-primary uppercase">
                          Recommended
                        </span>
                      ) : null}
                      <p className="text-base font-semibold text-foreground">{plan.name}</p>
                      <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-400">
                        {dailyRoiLabel(plan.dailyRoiBps)} daily
                      </p>
                      <dl className="mt-3 space-y-1 text-xs text-muted-foreground">
                        <div className="flex justify-between gap-2">
                          <dt>Duration</dt>
                          <dd className="font-medium text-foreground">{plan.termDays} days</dd>
                        </div>
                        <div className="flex justify-between gap-2">
                          <dt>Minimum</dt>
                          <dd className="font-medium text-foreground">
                            <CurrencyDisplay amountMinor={Number(plan.minPrincipalMinor)} />
                          </dd>
                        </div>
                        <div className="flex justify-between gap-2">
                          <dt>Maximum</dt>
                          <dd className="font-medium text-foreground">
                            <CurrencyDisplay amountMinor={Number(plan.maxPrincipalMinor)} />
                          </dd>
                        </div>
                        <div className="flex justify-between gap-2">
                          <dt>Expected total return</dt>
                          <dd className="font-medium text-foreground">
                            {plan.totalRoiBps != null
                              ? `${(plan.totalRoiBps / 100).toFixed(2)}%`
                              : `${((plan.dailyRoiBps * plan.termDays) / 100).toFixed(2)}%`}
                          </dd>
                        </div>
                      </dl>
                      <p className="mt-3 text-xs text-muted-foreground">
                        Best for: {PLAN_BEST_FOR[plan.slug] ?? "Steady certified returns"}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="space-y-3 rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <label className="block space-y-1.5 text-sm">
                  <span className="font-medium">Investment amount (USD)</span>
                  <MoneyAmountInput
                    placeholder="50,000.00"
                    value={amount}
                    disabled={pending}
                    onValueChange={setAmount}
                    className="min-w-[14rem]"
                  />
                </label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={pending}
                    onClick={fillMin}
                  >
                    MIN
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={pending}
                    onClick={fillMax}
                  >
                    MAX
                  </Button>
                </div>
              </div>

              {error ? (
                <Alert variant="destructive">
                  <AlertDescription className="whitespace-pre-line">{error}</AlertDescription>
                </Alert>
              ) : null}

              <Button
                type="button"
                size="lg"
                className="h-12 w-full gap-2 text-base"
                disabled={pending || !selected}
                onClick={() => void submit()}
              >
                {pending ? "Activating your investment..." : "🚀 Activate Investment"}
              </Button>
            </section>
          </div>

          <aside className="space-y-4">
            <section
              aria-label="Live investment summary"
              className="rounded-2xl border border-border/70 bg-card p-5 shadow-[var(--elevation-1)]"
            >
              <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                Live summary
              </h2>
              {selected && liveSummary && principalMinor != null ? (
                <dl className="mt-4 space-y-3 text-sm">
                  <SummaryRow
                    label="Investment Amount"
                    value={formatMoneyMinorUnits("en", principalMinor, currency)}
                    emphasize
                  />
                  <SummaryRow label="Daily ROI" value={dailyRoiLabel(selected.dailyRoiBps)} />
                  <SummaryRow
                    label="Daily Earnings"
                    value={formatMoneyMinorUnits("en", liveSummary.dailyEarningsMinor, currency)}
                  />
                  <SummaryRow label="Investment Duration" value={`${selected.termDays} Days`} />
                  <SummaryRow
                    label="Expected Total Earnings"
                    value={formatMoneyMinorUnits("en", liveSummary.expectedRoiMinor, currency)}
                  />
                  <SummaryRow
                    label="Expected Maturity Value"
                    value={formatMoneyMinorUnits("en", liveSummary.maturityValueMinor, currency)}
                  />
                  <SummaryRow label="Maturity Date" value={liveSummary.maturityLabel} />
                  <SummaryRow label="Next Daily Credit" value={liveSummary.nextCredit} mono />
                </dl>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">
                  Select a plan and enter an amount to preview earnings.
                </p>
              )}
            </section>

            <section className="rounded-2xl border border-sky-500/25 bg-sky-500/5 p-5">
              <div className="flex gap-3">
                <Info
                  className="mt-0.5 h-5 w-5 shrink-0 text-sky-600 dark:text-sky-400"
                  aria-hidden
                />
                <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
                  <p>
                    Your investment principal will be locked for the duration of your selected
                    investment plan.
                  </p>
                  <p>
                    Daily earnings are calculated continuously and settled according to your
                    investment schedule.
                  </p>
                  {selected?.earlyExitPolicy === "allowed_with_penalty" ? (
                    <p>
                      {(selected.earlyExitPenaltyBps ?? 0) > 0
                        ? "Stopping an investment before maturity may apply an early-exit penalty according to platform rules."
                        : "You may stop an investment before maturity. Final payout follows platform settlement rules."}
                    </p>
                  ) : (
                    <p>Early termination may not be available for every plan.</p>
                  )}
                </div>
              </div>
            </section>

            <Button asChild type="button" variant="ghost" className="w-full">
              <Link href="/portfolio">Back to portfolio</Link>
            </Button>
          </aside>
        </div>
      )}

      <ActivationSuccessModal
        open={Boolean(success)}
        summary={success}
        onView={() => {
          if (!success) return;
          router.replace(appPath(`/portfolio/${success.investmentId}`));
          router.refresh();
        }}
      />
    </div>
  );
}

function SummaryRow({
  label,
  value,
  emphasize = false,
  mono = false,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "text-right font-medium text-foreground",
          emphasize && "text-base font-semibold",
          mono && "font-mono text-xs",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function ActivationSuccessModal({
  open,
  summary,
  onView,
}: {
  open: boolean;
  summary: ActivationSuccess | null;
  onView: () => void;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => buttonRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(next) => (!next ? onView() : undefined)}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[var(--z-overlay)] bg-black/40 backdrop-blur-[2px]" />
        <DialogPrimitive.Content className="fixed top-1/2 left-1/2 z-[var(--z-modal)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border/80 bg-card p-6 shadow-[var(--elevation-3)]">
          {summary ? (
            <div className="space-y-5">
              <div className="space-y-2 text-center">
                <DialogPrimitive.Title className="text-xl font-semibold tracking-tight">
                  🎉 Investment Activated
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="text-sm text-muted-foreground">
                  Your plan is live and earning according to the certified schedule.
                </DialogPrimitive.Description>
              </div>
              <dl className="space-y-2 rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-sm">
                <SummaryRow label="Plan" value={summary.planName} />
                <SummaryRow label="Investment Amount" value={summary.amountLabel} emphasize />
                <SummaryRow label="Daily ROI" value={summary.dailyRoiLabel} />
                <SummaryRow label="Daily Earnings" value={summary.dailyEarningsLabel} />
                <SummaryRow label="Expected ROI" value={summary.expectedRoiLabel} />
                <SummaryRow label="Maturity Date" value={summary.maturityLabel} />
                <SummaryRow label="Current Status" value="🟢 Active" />
              </dl>
              <Button ref={buttonRef} type="button" className="w-full" onClick={onView}>
                View My Investment
              </Button>
            </div>
          ) : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
