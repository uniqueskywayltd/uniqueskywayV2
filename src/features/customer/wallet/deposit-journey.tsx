"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button, Input, Label, Skeleton } from "@/components/ui";
import { FormStepIndicator } from "@/components/ui/form-step-indicator";
import { getCustomerJson, postCustomerJson } from "@/features/customer/api-client";
import { useI18n } from "@/features/i18n/i18n-provider";

type FundingAsset = "BTC" | "ETH" | "USDT";

interface FundingWallet {
  id: string;
  asset: FundingAsset;
  network: string;
  address: string;
  qrCodeUrl: string | null;
  instructions: string | null;
}

interface CreateDepositResponse {
  depositIntent: { id: string };
}

const ASSETS: FundingAsset[] = ["BTC", "ETH", "USDT"];

export function DepositJourney() {
  const { t } = useI18n();
  const router = useRouter();
  const [asset, setAsset] = useState<FundingAsset>("USDT");
  const [wallets, setWallets] = useState<FundingWallet[]>([]);
  const [walletsLoading, setWalletsLoading] = useState(true);
  const [amount, setAmount] = useState("100.00");
  const [txHash, setTxHash] = useState("");
  const [note, setNote] = useState("");
  const [step, setStep] = useState<"select" | "transfer" | "notify" | "submitting">("select");
  const [error, setError] = useState<string | null>(null);

  const selectedWallet = wallets.find((wallet) => wallet.asset === asset) ?? wallets[0] ?? null;
  const amountMinor = dollarsToMinor(amount);

  useEffect(() => {
    let active = true;
    void getCustomerJson<{ wallets: FundingWallet[] }>("/api/customer/funding-wallets").then(
      (result) => {
        if (!active) return;
        setWalletsLoading(false);
        if (result.error) {
          setError(result.error);
          return;
        }
        setWallets(result.data?.wallets ?? []);
      },
    );
    return () => {
      active = false;
    };
  }, []);

  function onSelectContinue(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!selectedWallet) {
      setError("No active funding wallet is configured for this asset. Contact support.");
      return;
    }
    setStep("transfer");
  }

  function onTransferContinue(event: FormEvent) {
    event.preventDefault();
    setStep("notify");
  }

  async function onSubmit() {
    if (amountMinor === null || !selectedWallet) return;
    if (!txHash.trim()) {
      setError("Enter the transaction hash from your transfer.");
      return;
    }
    setStep("submitting");
    setError(null);

    const result = await postCustomerJson<CreateDepositResponse>(
      "/api/customer/deposits",
      {
        amountMinor: String(amountMinor),
        currency: "USD",
        provider: "manual",
        asset: selectedWallet.asset,
        fundingWalletId: selectedWallet.id,
        transactionHash: txHash.trim(),
        ...(note.trim() ? { customerNote: note.trim() } : {}),
      },
      { idempotencyKey: crypto.randomUUID() },
    );

    if (result.error || !result.data?.depositIntent) {
      setError(result.error ?? t("wallet.deposit_failed"));
      setStep("notify");
      return;
    }

    router.push(`/wallet/deposits/${result.data.depositIntent.id}`);
  }

  if (walletsLoading) {
    return <Skeleton className="h-48 w-full rounded-2xl" />;
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <FormStepIndicator
        steps={["Asset", "Transfer", "Notify", "Status"]}
        currentStep={step === "select" ? 1 : step === "transfer" ? 2 : 3}
      />

      {step === "select" ? (
        <form onSubmit={onSelectContinue} className="space-y-4 rounded-2xl border bg-card p-5">
          <div className="space-y-2">
            <Label>Select asset</Label>
            <div className="grid grid-cols-3 gap-2">
              {ASSETS.map((option) => (
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
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="w-full">
            Continue
          </Button>
        </form>
      ) : null}

      {step === "transfer" && selectedWallet ? (
        <form onSubmit={onTransferContinue} className="space-y-4 rounded-2xl border bg-card p-5">
          <div>
            <p className="text-sm text-muted-foreground">Send {selectedWallet.asset} on</p>
            <p className="font-semibold">{selectedWallet.network}</p>
          </div>
          <div>
            <Label>Wallet address</Label>
            <p className="mt-1 break-all rounded-md border bg-muted/40 px-3 py-2 font-mono text-sm">
              {selectedWallet.address}
            </p>
          </div>
          {selectedWallet.qrCodeUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={selectedWallet.qrCodeUrl}
              alt={`${selectedWallet.asset} QR code`}
              className="mx-auto h-40 w-40 rounded-md border bg-white object-contain p-2"
            />
          ) : null}
          {selectedWallet.instructions ? (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {selectedWallet.instructions}
            </p>
          ) : null}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setStep("select")}>
              Back
            </Button>
            <Button type="submit" className="flex-1">
              I sent the transfer
            </Button>
          </div>
        </form>
      ) : null}

      {step === "notify" || step === "submitting" ? (
        <div className="space-y-4 rounded-2xl border bg-card p-5">
          <div className="space-y-2">
            <Label htmlFor="deposit-amount">Amount to credit (USD)</Label>
            <Input
              id="deposit-amount"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              disabled={step === "submitting"}
            />
            <p className="text-sm text-muted-foreground">
              Enter the USD value of your {selectedWallet?.asset ?? "crypto"} transfer for admin
              review.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tx-hash">Transaction hash</Label>
            <Input
              id="tx-hash"
              value={txHash}
              onChange={(event) => setTxHash(event.target.value)}
              placeholder="0x… or blockchain tx id"
              disabled={step === "submitting"}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deposit-note">Optional note</Label>
            <Input
              id="deposit-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              disabled={step === "submitting"}
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={step === "submitting"}
              onClick={() => setStep("transfer")}
            >
              Back
            </Button>
            <Button
              type="button"
              className="flex-1"
              disabled={step === "submitting"}
              onClick={() => void onSubmit()}
            >
              {step === "submitting" ? "Submitting…" : "Submit for review"}
            </Button>
          </div>
        </div>
      ) : null}

      <Button asChild variant="ghost" className="w-full">
        <Link href="/wallet">{t("wallet.back")}</Link>
      </Button>
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
