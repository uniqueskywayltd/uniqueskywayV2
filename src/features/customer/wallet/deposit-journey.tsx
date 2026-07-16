"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button, Input, Label, Skeleton } from "@/components/ui";
import { FormStepIndicator } from "@/components/ui/form-step-indicator";
import {
  getCustomerJson,
  postCustomerForm,
  postCustomerJson,
} from "@/features/customer/api-client";
import {
  DepositSuccessModal,
  type DepositSuccessSummary,
} from "@/features/customer/wallet/deposit-success-modal";
import { useI18n } from "@/features/i18n/i18n-provider";
import { formatDateTime, formatMoneyMinorUnits } from "@/i18n/format";

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
  depositIntent: {
    id: string;
    currency: string;
    amountMinor: string;
    providerIntentId: string;
    fundingAsset: string | null;
    fundingNetwork: string | null;
    createdAt: string;
  };
  customerFirstName: string | null;
}

const ASSETS: FundingAsset[] = ["BTC", "ETH", "USDT"];

export function DepositJourney() {
  const { t } = useI18n();
  const router = useRouter();
  const [asset, setAsset] = useState<FundingAsset>("USDT");
  const [walletId, setWalletId] = useState<string | null>(null);
  const [wallets, setWallets] = useState<FundingWallet[]>([]);
  const [walletsLoading, setWalletsLoading] = useState(true);
  const [amount, setAmount] = useState("100.00");
  const [txHash, setTxHash] = useState("");
  const [note, setNote] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [step, setStep] = useState<"select" | "transfer" | "notify" | "submitting">("select");
  const [error, setError] = useState<string | null>(null);
  const [successSummary, setSuccessSummary] = useState<DepositSuccessSummary | null>(null);

  const assetWallets = useMemo(
    () => wallets.filter((wallet) => wallet.asset === asset),
    [asset, wallets],
  );
  const selectedWallet = useMemo(() => {
    if (walletId) {
      const match = assetWallets.find((wallet) => wallet.id === walletId);
      if (match) return match;
    }
    return assetWallets[0] ?? null;
  }, [assetWallets, walletId]);
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

  function selectAsset(next: FundingAsset) {
    setAsset(next);
    setWalletId(null);
  }

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

  async function copyAddress() {
    if (!selectedWallet) return;
    try {
      await navigator.clipboard.writeText(selectedWallet.address);
      setCopyFeedback("Address copied.");
    } catch {
      setCopyFeedback("Could not copy. Select the address manually.");
    }
  }

  async function uploadEvidence(file: File) {
    setError(null);
    const formData = new FormData();
    formData.set("file", file);
    const result = await postCustomerForm<{ url: string }>(
      "/api/customer/deposits/evidence",
      formData,
    );
    if (result.error || !result.data?.url) {
      setError(result.error ?? "Screenshot upload failed.");
      return;
    }
    setEvidenceUrl(result.data.url);
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
        ...(evidenceUrl ? { evidenceUrl } : {}),
      },
      { idempotencyKey: crypto.randomUUID() },
    );

    if (result.error || !result.data?.depositIntent) {
      setError(result.error ?? t("wallet.deposit_failed"));
      setStep("notify");
      return;
    }

    const intent = result.data.depositIntent;
    const minor = Number(intent.amountMinor);
    const amountLabel = Number.isFinite(minor)
      ? formatMoneyMinorUnits("en", minor, intent.currency || "USD")
      : amount;
    const firstName = result.data.customerFirstName?.trim() || "Investor";

    setSuccessSummary({
      firstName,
      amountLabel,
      currency: intent.currency || "USD",
      network: intent.fundingNetwork || selectedWallet.network,
      reference: intent.providerIntentId || intent.id,
      submittedAtLabel: formatDateTime("en", intent.createdAt || new Date().toISOString()),
    });
    setStep("notify");
  }

  function onSuccessConfirm() {
    setSuccessSummary(null);
    router.push("/wallet");
  }

  if (walletsLoading) {
    return <Skeleton className="h-48 w-full rounded-2xl" />;
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <DepositSuccessModal
        open={successSummary !== null}
        summary={successSummary}
        onConfirm={onSuccessConfirm}
      />
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
                  onClick={() => selectAsset(option)}
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
          {assetWallets.length > 1 ? (
            <div className="space-y-2">
              <Label htmlFor="funding-network">Network</Label>
              <select
                id="funding-network"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={selectedWallet?.id ?? ""}
                onChange={(event) => setWalletId(event.target.value)}
              >
                {assetWallets.map((wallet) => (
                  <option key={wallet.id} value={wallet.id}>
                    {wallet.network}
                  </option>
                ))}
              </select>
            </div>
          ) : selectedWallet ? (
            <p className="text-sm text-muted-foreground">Network: {selectedWallet.network}</p>
          ) : null}
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
            <div className="mt-2 flex items-center gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => void copyAddress()}>
                Copy address
              </Button>
              {copyFeedback ? (
                <span className="text-xs text-muted-foreground">{copyFeedback}</span>
              ) : null}
            </div>
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
          <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
            <p>
              <span className="text-muted-foreground">Asset:</span> {selectedWallet?.asset}
            </p>
            <p>
              <span className="text-muted-foreground">Network:</span> {selectedWallet?.network}
            </p>
          </div>
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
          <div className="space-y-2">
            <Label htmlFor="deposit-screenshot">Optional screenshot</Label>
            <Input
              id="deposit-screenshot"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              disabled={step === "submitting"}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadEvidence(file);
                event.target.value = "";
              }}
            />
            {evidenceUrl ? (
              <p className="text-xs text-muted-foreground">Screenshot attached for admin review.</p>
            ) : null}
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
