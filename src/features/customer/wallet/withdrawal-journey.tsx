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

type DestinationMode = "crypto_wallet" | "bank_transfer";

export function WithdrawalJourney() {
  const { t } = useI18n();
  const router = useRouter();
  const [availableMinor, setAvailableMinor] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<DestinationMode>("crypto_wallet");
  const [asset, setAsset] = useState<"BTC" | "ETH" | "USDT">("USDT");
  const [network, setNetwork] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
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

  function destinationReference(): string {
    if (mode === "crypto_wallet") {
      return JSON.stringify({
        asset,
        network: network.trim(),
        address: walletAddress.trim(),
      });
    }
    return JSON.stringify({
      bankName: bankName.trim(),
      accountName: accountName.trim(),
      accountNumber: accountNumber.trim(),
    });
  }

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
    if (available === 0) {
      setError(t("wallet.no_available"));
      return;
    }
    if (mode === "crypto_wallet") {
      if (!walletAddress.trim() || !network.trim()) {
        setError("Wallet address and network are required.");
        return;
      }
    } else if (!bankName.trim() || !accountName.trim() || !accountNumber.trim()) {
      setError("Bank name, account name, and account number are required.");
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
        destinationType: mode,
        destinationReference: destinationReference(),
        ...(mode === "crypto_wallet" ? { asset, network: network.trim() } : {}),
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

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <FormStepIndicator
        steps={[t("wallet.step_amount"), t("wallet.step_confirm"), t("wallet.step_status")]}
        currentStep={step === "amount" ? 1 : 2}
      />

      {step === "amount" ? (
        <form onSubmit={onContinue} className="space-y-4 rounded-2xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">
            Available:{" "}
            {availableMinor === null ? (
              <Skeleton className="inline-block h-4 w-16" />
            ) : (
              <CurrencyDisplay amountMinor={Number(availableMinor)} currency="USD" />
            )}
          </p>
          <div className="space-y-2">
            <Label htmlFor="withdraw-amount">{t("wallet.amount_usd")}</Label>
            <Input
              id="withdraw-amount"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Destination</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={mode === "crypto_wallet" ? "default" : "outline"}
                onClick={() => setMode("crypto_wallet")}
              >
                Crypto
              </Button>
              <Button
                type="button"
                variant={mode === "bank_transfer" ? "default" : "outline"}
                onClick={() => setMode("bank_transfer")}
              >
                Bank transfer
              </Button>
            </div>
          </div>
          {mode === "crypto_wallet" ? (
            <>
              <div className="grid grid-cols-3 gap-2">
                {(["BTC", "ETH", "USDT"] as const).map((option) => (
                  <Button
                    key={option}
                    type="button"
                    variant={asset === option ? "default" : "outline"}
                    onClick={() => setAsset(option)}
                  >
                    {option}
                  </Button>
                ))}
              </div>
              <div className="space-y-2">
                <Label htmlFor="network">Network</Label>
                <Input
                  id="network"
                  value={network}
                  onChange={(event) => setNetwork(event.target.value)}
                  placeholder="e.g. TRC20, ERC20, Bitcoin"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wallet-address">Wallet address</Label>
                <Input
                  id="wallet-address"
                  value={walletAddress}
                  onChange={(event) => setWalletAddress(event.target.value)}
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="bank-name">Bank name</Label>
                <Input
                  id="bank-name"
                  value={bankName}
                  onChange={(event) => setBankName(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account-name">Account name</Label>
                <Input
                  id="account-name"
                  value={accountName}
                  onChange={(event) => setAccountName(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account-number">Account number</Label>
                <Input
                  id="account-number"
                  value={accountNumber}
                  onChange={(event) => setAccountNumber(event.target.value)}
                />
              </div>
            </>
          )}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="w-full">
            Continue
          </Button>
        </form>
      ) : null}

      {step === "confirm" || step === "submitting" ? (
        <div className="space-y-4 rounded-2xl border bg-card p-5">
          <p className="text-sm">
            Withdraw{" "}
            <strong>
              {amountMinor !== null ? (
                <CurrencyDisplay amountMinor={amountMinor} currency="USD" />
              ) : (
                amount
              )}
            </strong>{" "}
            via {mode === "crypto_wallet" ? `${asset} wallet` : "bank transfer"}.
          </p>
          <pre className="overflow-x-auto rounded-md border bg-muted/30 p-3 text-xs">
            {destinationReference()}
          </pre>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={step === "submitting"}
              onClick={() => setStep("amount")}
            >
              Back
            </Button>
            <Button
              type="button"
              className="flex-1"
              disabled={step === "submitting"}
              onClick={() => void onSubmit()}
            >
              {step === "submitting" ? "Submitting…" : "Submit request"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function dollarsToMinor(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  const [whole, fraction = ""] = trimmed.split(".");
  const cents = `${whole}${fraction.padEnd(2, "0")}`.replace(/^0+(?=\d)/, "");
  const parsed = Number(cents);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}
