"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button, Input, Label, Skeleton } from "@/components/ui";
import { FormStepIndicator } from "@/components/ui/form-step-indicator";
import { MoneyAmountInput } from "@/components/ui/money-amount-input";
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
import { formatDateTime } from "@/i18n/format";
import { formatMoneyMinorUnits, parsePositiveMoneyInputToMinor } from "@/lib/money-format";

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
  const { t, language } = useI18n();
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
  const amountMinor = parsePositiveMoneyInputToMinor(amount);

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
      setError(t("wallet.no_funding_wallet"));
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
      setCopyFeedback(t("wallet.address_copied"));
    } catch {
      setCopyFeedback(t("wallet.address_copy_failed"));
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
      setError(result.error ?? t("wallet.screenshot_upload_failed"));
      return;
    }
    setEvidenceUrl(result.data.url);
  }

  async function onSubmit() {
    if (amountMinor === null || !selectedWallet) return;
    if (!txHash.trim()) {
      setError(t("wallet.tx_hash_required"));
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
      ? formatMoneyMinorUnits(language, minor, intent.currency || "USD")
      : amount;
    const firstName = result.data.customerFirstName?.trim() || t("wallet.default_investor_name");

    setSuccessSummary({
      firstName,
      amountLabel,
      currency: intent.currency || "USD",
      network: intent.fundingNetwork || selectedWallet.network,
      reference: intent.providerIntentId || intent.id,
      submittedAtLabel: formatDateTime(language, intent.createdAt || new Date().toISOString()),
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
        steps={[
          t("wallet.step_asset"),
          t("wallet.step_transfer"),
          t("wallet.step_notify"),
          t("wallet.step_status"),
        ]}
        currentStep={step === "select" ? 1 : step === "transfer" ? 2 : 3}
      />

      {step === "select" ? (
        <form onSubmit={onSelectContinue} className="space-y-4 rounded-2xl border bg-card p-5">
          <div className="space-y-2">
            <Label>{t("wallet.select_asset")}</Label>
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
              <Label htmlFor="funding-network">{t("wallet.network")}</Label>
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
            <p className="text-sm text-muted-foreground">
              {t("wallet.network")}: {selectedWallet.network}
            </p>
          ) : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="w-full">
            {t("wallet.continue")}
          </Button>
        </form>
      ) : null}

      {step === "transfer" && selectedWallet ? (
        <form onSubmit={onTransferContinue} className="space-y-4 rounded-2xl border bg-card p-5">
          <div>
            <p className="text-sm text-muted-foreground">
              {t("wallet.send_asset_on", { asset: selectedWallet.asset })}
            </p>
            <p className="font-semibold">{selectedWallet.network}</p>
          </div>
          <div>
            <Label>{t("wallet.wallet_address")}</Label>
            <p className="mt-1 break-all rounded-md border bg-muted/40 px-3 py-2 font-mono text-sm">
              {selectedWallet.address}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => void copyAddress()}>
                {t("wallet.copy_address")}
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
              alt={t("wallet.qr_code_alt", { asset: selectedWallet.asset })}
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
              {t("wallet.back")}
            </Button>
            <Button type="submit" className="flex-1">
              {t("wallet.sent_transfer")}
            </Button>
          </div>
        </form>
      ) : null}

      {step === "notify" || step === "submitting" ? (
        <div className="space-y-4 rounded-2xl border bg-card p-5">
          <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
            <p>
              <span className="text-muted-foreground">{t("wallet.step_asset")}:</span>{" "}
              {selectedWallet?.asset}
            </p>
            <p>
              <span className="text-muted-foreground">{t("wallet.network")}:</span>{" "}
              {selectedWallet?.network}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="deposit-amount">{t("wallet.amount_to_credit")}</Label>
            <MoneyAmountInput
              id="deposit-amount"
              value={amount}
              onValueChange={setAmount}
              disabled={step === "submitting"}
            />
            <p className="text-sm text-muted-foreground">
              {t("wallet.deposit_credit_hint", {
                asset: selectedWallet?.asset ?? "crypto",
              })}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tx-hash">{t("wallet.tx_hash")}</Label>
            <Input
              id="tx-hash"
              value={txHash}
              onChange={(event) => setTxHash(event.target.value)}
              placeholder={t("wallet.tx_hash_placeholder")}
              disabled={step === "submitting"}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deposit-note">{t("wallet.optional_note")}</Label>
            <Input
              id="deposit-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              disabled={step === "submitting"}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deposit-screenshot">{t("wallet.optional_screenshot")}</Label>
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
              <p className="text-xs text-muted-foreground">{t("wallet.screenshot_attached")}</p>
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
              {t("wallet.back")}
            </Button>
            <Button
              type="button"
              className="flex-1"
              disabled={step === "submitting"}
              onClick={() => void onSubmit()}
            >
              {step === "submitting" ? t("wallet.submitting") : t("wallet.submit_for_review")}
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
