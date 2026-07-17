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
import { useI18n } from "@/features/i18n/i18n-provider";
import type { MessageKey } from "@/i18n/messages/en";
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

const PLAN_BEST_FOR_KEYS: Record<string, MessageKey> = {
  silver: "portfolio.activate.plan.silver",
  gold: "portfolio.activate.plan.gold",
  classic: "portfolio.activate.plan.classic",
  master: "portfolio.activate.plan.master",
};

function dailyRoiLabel(bps: number): string {
  return `${(bps / 100).toFixed(2)}%`;
}

function formatMaturityLabel(termDays: number, language: string, now = new Date()): string {
  const maturity = new Date(now.getTime() + termDays * 86_400_000);
  return new Intl.DateTimeFormat(language, {
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

function presentActivationError(
  message: string | undefined,
  t: (key: string, values?: Record<string, string | number>) => string,
  reference?: string,
): string {
  const raw = (message ?? "").trim();
  const lower = raw.toLowerCase();
  let text = t("portfolio.activate.error.generic");
  if (
    lower.includes("insufficient available balance") ||
    lower.includes("available balance is insufficient")
  ) {
    text = t("portfolio.activate.error.insufficient");
  } else if (lower.includes("below the minimum")) {
    text = t("portfolio.activate.error.below_min");
  } else if (lower.includes("exceeds this plan") || lower.includes("outside the investment plan")) {
    text = t("portfolio.activate.error.exceeds_max");
  } else if (
    raw &&
    !lower.includes("couldn't complete") &&
    !lower.includes("unable to complete") &&
    !lower.includes("unable to activate")
  ) {
    text = raw;
  }
  if (reference) return `${text}\n\n${t("portfolio.activate.error.reference")}\n${reference}`;
  return text;
}

/** Activate an investment from available wallet balance using certified plan versions. */
export function ActivateInvestmentSurface() {
  const router = useRouter();
  const { t, language } = useI18n();
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
        setError(plansResult.error ?? walletResult.error ?? t("portfolio.activate.error.load"));
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
  }, [t]);

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const principalMinor = useMemo(() => parsePositiveMoneyInputToMinorBigInt(amount), [amount]);

  const selected = useMemo(() => {
    if (principalMinor != null && plans.length > 0) {
      const eligible = plans.find(
        (plan) =>
          principalMinor >= BigInt(plan.minPrincipalMinor) &&
          principalMinor <= BigInt(plan.maxPrincipalMinor),
      );
      if (eligible) return eligible;
    }
    return plans.find((plan) => plan.planVersionId === planVersionId) ?? null;
  }, [plans, planVersionId, principalMinor]);

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
      maturityLabel: formatMaturityLabel(selected.termDays, language, new Date(nowMs)),
      nextCredit: formatCountdown(secondsUntilNextNewYorkMidnight(new Date(nowMs))),
    };
  }, [selected, principalMinor, nowMs, language]);

  function fillMin() {
    if (!selected) return;
    setAmount(formatMoneyInputDisplay(minorToMajorInput(BigInt(selected.minPrincipalMinor))));
  }

  function fillMax() {
    if (!selected) return;
    const planMax = BigInt(selected.maxPrincipalMinor);
    const maxInvestable = availableMinor < planMax ? availableMinor : planMax;
    if (maxInvestable <= 0n) {
      setError(t("portfolio.activate.error.insufficient"));
      return;
    }
    setAmount(formatMoneyInputDisplay(minorToMajorInput(maxInvestable)));
  }

  async function submit() {
    if (!selected || submittingRef.current) return;
    if (principalMinor === null) {
      setError(t("portfolio.activate.error.invalid_amount"));
      return;
    }
    if (principalMinor < BigInt(selected.minPrincipalMinor)) {
      setError(t("portfolio.activate.error.below_min"));
      return;
    }
    if (principalMinor > BigInt(selected.maxPrincipalMinor)) {
      setError(t("portfolio.activate.error.exceeds_max"));
      return;
    }
    if (principalMinor > availableMinor) {
      setError(t("portfolio.activate.error.insufficient"));
      return;
    }

    submittingRef.current = true;
    setPending(true);
    setError(null);

    const result = await postCustomerJson<{ investment: { id: string } }>(
      "/api/customer/investments",
      {
        principalMinor: principalMinor.toString(),
        idempotencyKey: `activate:${selected.planVersionId}:${principalMinor}`,
      },
    );

    if (result.error) {
      setError(presentActivationError(result.error, t, result.reference));
      setPending(false);
      submittingRef.current = false;
      return;
    }

    const investmentId = result.data?.investment.id;
    if (!investmentId) {
      setError(presentActivationError(undefined, t));
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
      amountLabel: formatMoneyMinorUnits(language, principalMinor, currency),
      dailyRoiLabel: dailyRoiLabel(selected.dailyRoiBps),
      dailyEarningsLabel: formatMoneyMinorUnits(language, dailyEarningsMinor, currency),
      expectedRoiLabel: formatMoneyMinorUnits(language, expectedRoiMinor, currency),
      maturityLabel: formatMaturityLabel(selected.termDays, language),
    });
    setPending(false);
  }

  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label={t("portfolio.loading.activation")}>
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
          {t("portfolio.activate.title")}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          {t("portfolio.activate.body")}
        </p>
      </header>

      <section
        aria-label={t("portfolio.activate.balance_aria")}
        className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/12 via-card to-card p-6 shadow-[var(--elevation-2)] sm:p-7"
      >
        <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">
          {t("portfolio.activate.wallet_balance")}
        </p>
        <p className="mt-2 font-heading text-4xl font-semibold tracking-tight text-foreground tabular-nums sm:text-5xl">
          <CurrencyDisplay amountMinor={Number(availableMinor)} currency={currency} />
        </p>
        <p className="mt-2 text-sm font-medium text-muted-foreground">
          {t("portfolio.activate.available_to_invest")}
        </p>
        {(lockedMinor > 0n || reservedMinor > 0n) && (
          <p className="mt-3 text-xs text-muted-foreground">
            {lockedMinor > 0n ? (
              <>
                {t("portfolio.summary.invested_principal")}:{" "}
                <CurrencyDisplay amountMinor={Number(lockedMinor)} currency={currency} />
              </>
            ) : null}
            {lockedMinor > 0n && reservedMinor > 0n ? " · " : null}
            {reservedMinor > 0n ? (
              <>
                {t("portfolio.activate.reserved_withdrawals")}:{" "}
                <CurrencyDisplay amountMinor={Number(reservedMinor)} currency={currency} />
              </>
            ) : null}
          </p>
        )}
      </section>

      {plans.length === 0 ? (
        <Alert>
          <AlertDescription>{t("portfolio.activate.no_plans")}</AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div className="space-y-5">
            <section aria-label={t("portfolio.activate.plans_aria")} className="space-y-3">
              <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                {t("portfolio.activate.plan_assigned")}
              </h2>
              <p className="text-sm text-muted-foreground">{t("portfolio.activate.plan_hint")}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {plans.map((plan) => {
                  const selectedPlan = plan.planVersionId === selected?.planVersionId;
                  const recommended = plan.slug === "gold";
                  return (
                    <button
                      key={plan.planVersionId}
                      type="button"
                      disabled={pending || principalMinor != null}
                      onClick={() => setPlanVersionId(plan.planVersionId)}
                      className={cn(
                        "relative rounded-2xl border bg-card p-4 text-left shadow-sm",
                        "motion-safe:transition-[border-color,box-shadow,transform] motion-safe:duration-200 motion-reduce:transition-none",
                        selectedPlan
                          ? "border-primary shadow-[var(--elevation-2)] ring-2 ring-primary/30"
                          : "border-border/70 hover:border-primary/30 motion-safe:hover:-translate-y-0.5",
                        principalMinor != null ? "cursor-default" : null,
                      )}
                    >
                      {recommended ? (
                        <span className="absolute top-3 right-3 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-primary uppercase">
                          {t("portfolio.activate.recommended")}
                        </span>
                      ) : null}
                      <p className="text-base font-semibold text-foreground">{plan.name}</p>
                      <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-400">
                        {dailyRoiLabel(plan.dailyRoiBps)} {t("portfolio.activate.daily_suffix")}
                      </p>
                      <dl className="mt-3 space-y-1 text-xs text-muted-foreground">
                        <div className="flex justify-between gap-2">
                          <dt>{t("plans.duration")}</dt>
                          <dd className="font-medium text-foreground">
                            {t("plans.days", { count: plan.termDays })}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-2">
                          <dt>{t("plans.min")}</dt>
                          <dd className="font-medium text-foreground">
                            <CurrencyDisplay amountMinor={Number(plan.minPrincipalMinor)} />
                          </dd>
                        </div>
                        <div className="flex justify-between gap-2">
                          <dt>{t("plans.max")}</dt>
                          <dd className="font-medium text-foreground">
                            <CurrencyDisplay amountMinor={Number(plan.maxPrincipalMinor)} />
                          </dd>
                        </div>
                        <div className="flex justify-between gap-2">
                          <dt>{t("portfolio.activate.expected_return")}</dt>
                          <dd className="font-medium text-foreground">
                            {plan.totalRoiBps != null
                              ? `${(plan.totalRoiBps / 100).toFixed(2)}%`
                              : `${((plan.dailyRoiBps * plan.termDays) / 100).toFixed(2)}%`}
                          </dd>
                        </div>
                      </dl>
                      <p className="mt-3 text-xs text-muted-foreground">
                        {t("portfolio.activate.best_for")}{" "}
                        {t(PLAN_BEST_FOR_KEYS[plan.slug] ?? "portfolio.activate.plan.default")}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="space-y-3 rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <label className="block space-y-1.5 text-sm">
                  <span className="font-medium">{t("portfolio.activate.amount_label")}</span>
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
                    {t("portfolio.activate.min_btn")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={pending}
                    onClick={fillMax}
                  >
                    {t("portfolio.activate.max_btn")}
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
                {pending ? t("portfolio.activate.starting") : t("portfolio.activate.confirm")}
              </Button>
            </section>
          </div>

          <aside className="space-y-4">
            <section
              aria-label={t("portfolio.activate.summary_aria")}
              className="rounded-2xl border border-border/70 bg-card p-5 shadow-[var(--elevation-1)]"
            >
              <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                {t("portfolio.activate.live_summary")}
              </h2>
              {selected && liveSummary && principalMinor != null ? (
                <dl className="mt-4 space-y-3 text-sm">
                  <SummaryRow
                    label={t("portfolio.activate.summary.amount")}
                    value={formatMoneyMinorUnits(language, principalMinor, currency)}
                    emphasize
                  />
                  <SummaryRow
                    label={t("portfolio.card.daily_roi")}
                    value={dailyRoiLabel(selected.dailyRoiBps)}
                  />
                  <SummaryRow
                    label={t("portfolio.activate.summary.daily_earnings")}
                    value={formatMoneyMinorUnits(
                      language,
                      liveSummary.dailyEarningsMinor,
                      currency,
                    )}
                  />
                  <SummaryRow
                    label={t("portfolio.activate.summary.duration")}
                    value={t("plans.days", { count: selected.termDays })}
                  />
                  <SummaryRow
                    label={t("portfolio.activate.summary.expected_earnings")}
                    value={formatMoneyMinorUnits(language, liveSummary.expectedRoiMinor, currency)}
                  />
                  <SummaryRow
                    label={t("portfolio.activate.summary.maturity_value")}
                    value={formatMoneyMinorUnits(
                      language,
                      liveSummary.maturityValueMinor,
                      currency,
                    )}
                  />
                  <SummaryRow
                    label={t("portfolio.activate.summary.maturity_date")}
                    value={liveSummary.maturityLabel}
                  />
                  <SummaryRow
                    label={t("portfolio.activate.summary.next_credit")}
                    value={liveSummary.nextCredit}
                    mono
                  />
                </dl>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">
                  {t("portfolio.activate.preview_hint")}
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
                  <p>{t("portfolio.activate.info.principal_committed")}</p>
                  <p>{t("portfolio.activate.info.daily_earnings")}</p>
                  <p>{t("portfolio.activate.info.terms_commitment")}</p>
                </div>
              </div>
            </section>

            <Button asChild type="button" variant="ghost" className="w-full">
              <Link href="/portfolio">{t("portfolio.activate.back_portfolio")}</Link>
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
  const { t } = useI18n();
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
                  {t("portfolio.activate.started")}
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="text-sm text-muted-foreground">
                  {t("portfolio.activate.started_body")}
                </DialogPrimitive.Description>
              </div>
              <dl className="space-y-2 rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-sm">
                <SummaryRow label={t("portfolio.activate.modal.plan")} value={summary.planName} />
                <SummaryRow
                  label={t("portfolio.activate.summary.amount")}
                  value={summary.amountLabel}
                  emphasize
                />
                <SummaryRow label={t("portfolio.card.daily_roi")} value={summary.dailyRoiLabel} />
                <SummaryRow
                  label={t("portfolio.activate.summary.daily_earnings")}
                  value={summary.dailyEarningsLabel}
                />
                <SummaryRow
                  label={t("portfolio.activate.modal.expected_roi")}
                  value={summary.expectedRoiLabel}
                />
                <SummaryRow
                  label={t("portfolio.activate.summary.maturity_date")}
                  value={summary.maturityLabel}
                />
                <SummaryRow
                  label={t("portfolio.activate.modal.current_status")}
                  value={t("portfolio.activate.modal.status_active")}
                />
              </dl>
              <Button ref={buttonRef} type="button" className="w-full" onClick={onView}>
                {t("portfolio.activate.modal.view_investment")}
              </Button>
            </div>
          ) : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
