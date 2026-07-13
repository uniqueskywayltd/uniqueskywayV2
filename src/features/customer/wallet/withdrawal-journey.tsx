"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button, Input, Label } from "@/components/ui";
import { CurrencyDisplay } from "@/components/ui/display";
import { getCustomerJson, postCustomerJson } from "@/features/customer/api-client";
import type { WalletOverviewResponse } from "@/features/customer/wallet/types";

interface CreateWithdrawalResponse {
  withdrawal: { id: string };
}

export function WithdrawalJourney() {
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
      setError("Enter a valid USD amount greater than zero.");
      return;
    }
    if (available !== null && amountMinor > available) {
      setError("Withdrawal cannot exceed Available balance.");
      return;
    }
    if (!destination.trim()) {
      setError("Destination reference is required.");
      return;
    }
    if (available === 0) {
      setError("You do not have Available funds to withdraw yet.");
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
      setError(result.error ?? "Withdrawal could not be created.");
      setStep("confirm");
      return;
    }

    router.push(`/wallet/withdrawals/${result.data.withdrawal.id}`);
  }

  if (loadError) {
    return (
      <section className="rounded-xl border border-border/80 p-5">
        <h2 className="text-base font-semibold">Withdrawal unavailable</h2>
        <p className="mt-2 text-sm text-muted-foreground">{loadError}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/contact">Contact support</Link>
        </Button>
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <p className="sr-only">Primary question: How do I get my money?</p>

      <section className="rounded-xl border border-border/80 p-4">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Available / withdrawable
        </p>
        <p className="mt-1 text-2xl font-semibold">
          {availableMinor === null ? (
            "…"
          ) : (
            <CurrencyDisplay amountMinor={Number(availableMinor)} />
          )}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Withdrawals reduce anxiety with clear status → next step → expectancy → support.
        </p>
      </section>

      {step === "amount" ? (
        <form onSubmit={onContinue} className="space-y-4 rounded-xl border border-border/80 p-5">
          <div className="space-y-2">
            <Label htmlFor="withdraw-amount">Amount (USD)</Label>
            <Input
              id="withdraw-amount"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="withdraw-destination">Destination reference</Label>
            <Input
              id="withdraw-destination"
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              placeholder="Paystack recipient code"
            />
            <p className="text-sm text-muted-foreground">
              Uses the certified payout destination type. No alternate providers in this release.
            </p>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex gap-3">
            <Button type="submit">Continue</Button>
            <Button asChild type="button" variant="ghost">
              <Link href="/wallet">Cancel</Link>
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4 rounded-xl border border-border/80 p-5">
          <h2 className="text-base font-semibold">Confirm withdrawal</h2>
          <p className="text-sm text-muted-foreground">
            After you submit, this amount is reserved so it cannot be spent twice. Review may occur
            before payout — timing is expectancy, not a promise.
          </p>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Amount</dt>
              <dd className="font-mono">${Number(amount).toFixed(2)} USD</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Destination</dt>
              <dd className="max-w-[14rem] truncate text-right">{destination}</dd>
            </div>
            {available !== null && amountMinor !== null ? (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Remaining available after request</dt>
                <dd>
                  <CurrencyDisplay amountMinor={Math.max(available - amountMinor, 0)} />
                </dd>
              </div>
            ) : null}
          </dl>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={() => void onSubmit()} disabled={step === "submitting"}>
              {step === "submitting" ? "Submitting…" : "Submit withdrawal"}
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
          <Button asChild variant="ghost" size="sm">
            <Link href="/contact">Need help? Contact support</Link>
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
