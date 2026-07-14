"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button, Input, Label } from "@/components/ui";
import { postCustomerJson } from "@/features/customer/api-client";

interface CreateDepositResponse {
  depositIntent: { id: string; providerAuthorizationUrl?: string | null };
  providerAction: { authorizationUrl?: string | null } | null;
}

export function DepositJourney() {
  const router = useRouter();
  const [amount, setAmount] = useState("100.00");
  const [step, setStep] = useState<"amount" | "confirm" | "submitting">("amount");
  const [error, setError] = useState<string | null>(null);

  const amountMinor = dollarsToMinor(amount);

  function onContinue(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (amountMinor === null || amountMinor <= 0) {
      setError("Enter a valid USD amount greater than zero.");
      return;
    }
    setStep("confirm");
  }

  async function onSubmit() {
    if (amountMinor === null) return;
    setStep("submitting");
    setError(null);

    const result = await postCustomerJson<CreateDepositResponse>(
      "/api/customer/deposits",
      {
        amountMinor: String(amountMinor),
        currency: "USD",
        provider: "paystack",
      },
      { idempotencyKey: crypto.randomUUID() },
    );

    if (result.error || !result.data?.depositIntent) {
      setError(result.error ?? "Deposit could not be created.");
      setStep("confirm");
      return;
    }

    const authUrl =
      result.data.providerAction?.authorizationUrl ??
      result.data.depositIntent.providerAuthorizationUrl;

    if (authUrl) {
      window.location.assign(authUrl);
      return;
    }

    router.push(`/wallet/deposits/${result.data.depositIntent.id}`);
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <p className="sr-only">Primary question: How do I add funds safely?</p>
      <ol
        className="flex flex-wrap gap-2 text-xs text-muted-foreground"
        aria-label="Deposit steps"
      >
        <li className={step === "amount" ? "font-semibold text-foreground" : undefined}>
          1 Amount
        </li>
        <li aria-hidden>→</li>
        <li className={step !== "amount" ? "font-semibold text-foreground" : undefined}>
          2 Confirm
        </li>
        <li aria-hidden>→</li>
        <li>3 Provider</li>
        <li aria-hidden>→</li>
        <li>4 Status</li>
      </ol>

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
            <Label htmlFor="deposit-amount">Amount (USD)</Label>
            <Input
              id="deposit-amount"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="100.00"
            />
            <p className="text-sm text-muted-foreground">
              Money should feel safe — not fast. Funds become Available only after confirmation.
            </p>
          </div>
          {error ? <p className="relative text-sm text-destructive">{error}</p> : null}
          <div className="relative flex gap-3">
            <Button type="submit">Continue</Button>
            <Button asChild type="button" variant="ghost">
              <Link href="/wallet">Cancel</Link>
            </Button>
          </div>
        </form>
      ) : (
        <div className="relative overflow-hidden space-y-4 rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
          <div
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,var(--primary)_0%,transparent_50%)] opacity-[0.08] dark:opacity-[0.16]"
            aria-hidden
          />
          <h2 className="relative text-base font-semibold text-foreground">Confirm deposit</h2>
          <dl className="relative space-y-3 text-sm">
            <div className="flex justify-between gap-4 border-b border-border/60 py-2">
              <dt className="text-muted-foreground">Amount</dt>
              <dd className="font-mono font-medium tabular-nums">
                ${Number(amount).toFixed(2)} USD
              </dd>
            </div>
            <div className="flex justify-between gap-4 py-2">
              <dt className="text-muted-foreground">What happens next</dt>
              <dd className="max-w-[14rem] text-right text-muted-foreground">
                You’ll complete payment with the certified provider, then wait for confirmation.
              </dd>
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
              {step === "submitting" ? "Starting…" : "Continue to payment"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={step === "submitting"}
              onClick={() => setStep("amount")}
            >
              Back
            </Button>
          </div>
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
