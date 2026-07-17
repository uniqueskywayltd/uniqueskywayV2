"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button, Input, Label, Skeleton } from "@/components/ui";
import { CurrencyDisplay } from "@/components/ui/display";
import { FormStepIndicator } from "@/components/ui/form-step-indicator";
import { MoneyAmountInput } from "@/components/ui/money-amount-input";
import { getCustomerJson, postCustomerJson } from "@/features/customer/api-client";
import { useI18n } from "@/features/i18n/i18n-provider";
import type { WalletOverviewResponse } from "@/features/customer/wallet/types";
import { parsePositiveMoneyInputToMinor } from "@/lib/money-format";
import {
  cryptoMethodLabel,
  networkDisplayLabel,
  shortenWalletAddress,
} from "@/lib/withdrawal-destination";

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

  const amountMinor = parsePositiveMoneyInputToMinor(amount);
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
        setError(t("wallet.crypto_destination_required"));
        return;
      }
    } else if (!bankName.trim() || !accountName.trim() || !accountNumber.trim()) {
      setError(t("wallet.bank_destination_required"));
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
        <h2 className="text-base font-semibold text-foreground">
          {t("wallet.withdrawal_unavailable")}
        </h2>
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
            {t("wallet.available_label")}:{" "}
            {availableMinor === null ? (
              <Skeleton className="inline-block h-4 w-16" />
            ) : (
              <CurrencyDisplay amountMinor={Number(availableMinor)} currency="USD" />
            )}
          </p>
          <div className="space-y-2">
            <Label htmlFor="withdraw-amount">{t("wallet.amount_usd")}</Label>
            <MoneyAmountInput id="withdraw-amount" value={amount} onValueChange={setAmount} />
          </div>
          <div className="space-y-2">
            <Label>{t("wallet.destination")}</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={mode === "crypto_wallet" ? "default" : "outline"}
                onClick={() => setMode("crypto_wallet")}
              >
                {t("wallet.dest_crypto")}
              </Button>
              <Button
                type="button"
                variant={mode === "bank_transfer" ? "default" : "outline"}
                onClick={() => setMode("bank_transfer")}
              >
                {t("wallet.dest_bank_transfer")}
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
                <Label htmlFor="network">{t("wallet.network")}</Label>
                <Input
                  id="network"
                  value={network}
                  onChange={(event) => setNetwork(event.target.value)}
                  placeholder={t("wallet.network_placeholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wallet-address">{t("wallet.wallet_address")}</Label>
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
                <Label htmlFor="bank-name">{t("wallet.bank_name")}</Label>
                <Input
                  id="bank-name"
                  value={bankName}
                  onChange={(event) => setBankName(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account-name">{t("wallet.account_name")}</Label>
                <Input
                  id="account-name"
                  value={accountName}
                  onChange={(event) => setAccountName(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account-number">{t("wallet.account_number")}</Label>
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
            {t("wallet.continue")}
          </Button>
        </form>
      ) : null}

      {step === "confirm" || step === "submitting" ? (
        <div className="space-y-4 rounded-2xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">{t("wallet.withdraw_confirm_prompt")}</p>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{t("wallet.amount")}</dt>
              <dd className="font-semibold">
                {amountMinor !== null ? (
                  <CurrencyDisplay amountMinor={amountMinor} currency="USD" />
                ) : (
                  amount
                )}
              </dd>
            </div>
            {mode === "crypto_wallet" ? (
              <>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{t("wallet.withdrawal_method")}</dt>
                  <dd>{cryptoMethodLabel(asset)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{t("wallet.network")}</dt>
                  <dd>{networkDisplayLabel(network)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{t("wallet.destination_wallet")}</dt>
                  <dd className="font-mono text-xs">
                    {shortenWalletAddress(walletAddress.trim())}
                  </dd>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{t("wallet.withdrawal_method")}</dt>
                  <dd>{t("wallet.dest_bank_transfer")}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{t("wallet.bank_name")}</dt>
                  <dd>{bankName.trim()}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{t("wallet.account_name")}</dt>
                  <dd>{accountName.trim()}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{t("wallet.account_number")}</dt>
                  <dd>{accountNumber.trim()}</dd>
                </div>
              </>
            )}
          </dl>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={step === "submitting"}
              onClick={() => setStep("amount")}
            >
              {t("wallet.back")}
            </Button>
            <Button
              type="button"
              className="flex-1"
              disabled={step === "submitting"}
              onClick={() => void onSubmit()}
            >
              {step === "submitting" ? t("wallet.submitting") : t("wallet.submit_request")}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
