"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button, Input, Label, Skeleton } from "@/components/ui";
import { CurrencyDisplay } from "@/components/ui/display";
import { FormStepIndicator } from "@/components/ui/form-step-indicator";
import { getCustomerJson, postCustomerJson } from "@/features/customer/api-client";
import { useI18n } from "@/features/i18n/i18n-provider";
import type { WalletOverviewResponse } from "@/features/customer/wallet/types";

interface CreateWithdrawalResponse {
  withdrawal: { id: string };
}

/** WP3 — withdrawal CTA/journey presentation; engine calls unchanged. */
export function WithdrawalJourney() {
  const { t } = useI18n();
  const router = useRouter();
  const [availableMinor, setAvailableMinor] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [destination, setDestination] = useState("");
  const [step, setStep] = useState<"amount" | "confirm" | "submitting">("amount");
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void getCustomerJson<WalletOverviewResponse>("/api/customer/wallet").then((result) => {
      if (!active) return;
      if (result.error) {
        setLoadError(result.error);
        return;
      }
      setAvailableMinor(result.data?.balances.availableBalanceMinor ?? "0");
    });
    return () => {
      active = false;
    };
  }, []);

  const amountMinor = dollarsToMinor(amount);
  const available = availableMinor === null ? null : Number(availableMinor);

  function onContinue(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (amountMinor === null || amountMinor <= 0) {
      setError(t("wallet.amount_invalid"));
      return;
    }
    if (available !== null && amountMinor > available) {
      setError(t("wallet.withdraw_exceeds"));
      return;
    }
    if (!destination.trim()) {
      setError(t("wallet.destination_required"));
      return;
    }
    if (available === 0) {
      setError(t("wallet.no_available"));
      return;
    }
    setStep("confirm");
  }

  async function onSubmit() {
    if (amountMinor === null) return;
    setStep("submitting");
    setError(null);

    const result = await postCustomerJson<CreateWithdrawalResponse>(
      "/api/customer/withdrawals",
      {
        amountMinor: String(amountMinor),
        currency: "USD",
        destinationType: "paystack_recipient",
        destinationReference: destination.trim(),
      },
      { idempotencyKey: crypto.randomUUID() },
    );

    if (result.error || !result.data?.withdrawal) {
      setError(result.error ?? t("wallet.withdraw_failed"));
      setStep("confirm");
      return;
    }

    router.push(`/wallet/withdrawals/${result.data.withdrawal.id}`);
  }

  if (loadError) {
    return (
      <section className="rounded-xl border border-border/80 bg-card p-5 shadow-sm">
        <h2 className="text-base font-semibold text-foreground">Withdrawal unavailable</h2>
        <p className="mt-2 text-sm text-muted-foreground">{loadError}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/contact">{t("wallet.contact_support")}</Link>
        </Button>
      </section>
    );
  }

  if (availableMinor === null) {
    return (
      <div className="mx-auto max-w-lg space-y-4" aria-busy="true" aria-label="Loading withdrawal">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <p className="sr-only">Primary question: How do I get my money?</p>
      <FormStepIndicator
        steps={[
          t("wallet.step_amount"),
          t("wallet.step_confirm"),
          t("wallet.step_review"),
          t("wallet.step_status"),
        ]}
        currentStep={step === "amount" ? 1 : 2}
      />

      <section className="relative overflow-hidden rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,var(--primary)_0%,transparent_50%)] opacity-[0.1] dark:opacity-[0.18]"
          aria-hidden
        />
        <p className="relative text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {t("wallet.available_to_withdraw")}
        </p>
        <p className="relative mt-2 text-2xl font-semibold tracking-tight text-foreground">
          <CurrencyDisplay amountMinor={Number(availableMinor)} />
        </p>
        <p className="relative mt-2 text-sm text-muted-foreground">{t("wallet.withdraw_reserve_hint")}</p>
      </section>

      {step === "amount" ? (
        <form
          onSubmit={onContinue}
          className="relative overflow-hidden space-y-4 rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-6"
        >
          <div
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,var(--primary)_0%,transparent_50%)] opacity-[0.08] dark:opacity-[0.16]"
            aria-hidden
          />
          <div className="relative space-y-2">
            <Label htmlFor="withdraw-amount">{t("wallet.amount_usd")}</Label>
            <Input
              id="withdraw-amount"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </div>
          <div className="relative space-y-2">
            <Label htmlFor="withdraw-destination">{t("wallet.destination_label")}</Label>
            <Input
              id="withdraw-destination"
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              placeholder="Paystack recipient code"
            />
            <p className="text-sm text-muted-foreground">{t("wallet.destination_hint")}</p>
          </div>
          {error ? <p className="relative text-sm text-destructive">{error}</p> : null}
          <div className="relative flex gap-3">
            <Button type="submit">{t("wallet.continue")}</Button>
            <Button asChild type="button" variant="ghost">
              <Link href="/wallet">{t("wallet.cancel")}</Link>
            </Button>
          </div>
        </form>
      ) : (
        <div className="relative overflow-hidden space-y-4 rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
          <div
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,var(--primary)_0%,transparent_50%)] opacity-[0.08] dark:opacity-[0.16]"
            aria-hidden
          />
          <h2 className="relative text-base font-semibold text-foreground">
            {t("wallet.confirm_withdrawal")}
          </h2>
          <p className="relative text-sm text-muted-foreground">{t("wallet.withdraw_confirm_hint")}</p>
          <dl className="relative space-y-3 text-sm">
            <div className="flex justify-between gap-4 border-b border-border/60 py-2">
              <dt className="text-muted-foreground">{t("wallet.amount")}</dt>
              <dd className="font-mono font-medium tabular-nums text-foreground">
                ${Number(amount).toFixed(2)} USD
              </dd>
            </div>
            <div className="flex justify-between gap-4 py-2">
              <dt className="text-muted-foreground">{t("wallet.destination")}</dt>
              <dd className="max-w-[14rem] truncate text-right text-foreground">{destination}</dd>
            </div>
          </dl>
          {error ? <p className="relative text-sm text-destructive">{error}</p> : null}
          <div className="relative flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={() => void onSubmit()}
              disabled={step === "submitting"}
              aria-busy={step === "submitting"}
            >
              {step === "submitting" ? t("wallet.submitting") : t("wallet.submit_withdrawal")}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={step === "submitting"}
              onClick={() => setStep("amount")}
            >
              {t("wallet.back")}
            </Button>
          </div>
          <Button asChild variant="ghost" size="sm" className="relative">
            <Link href="/contact">{t("wallet.need_help_support")}</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

function dollarsToMinor(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  const [dollars, cents = ""] = trimmed.split(".");
  return Number(dollars) * 100 + Number(cents.padEnd(2, "0"));
}
