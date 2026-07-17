"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { Alert, AlertDescription, Button, Card, Textarea } from "@/components/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getAdminJson, mutateAdminJson } from "../api-client";
import {
  formatAdminDateTime,
  formatUsdFromMinor,
  friendlyClientError,
  fundingMethodLabel,
} from "../lib/presentation";
import { parseWithdrawalDestination, shortenWalletAddress } from "@/lib/withdrawal-destination";
import { AdminInfoRow, AdminInfoSection, AdminStatusBadge } from "./admin-info";
import { AdminErrorBlock, AdminLoadingBlock, AdminPageHeader } from "./admin-states";

type LoadState = "loading" | "ready" | "error";

type CustomerSummary = {
  userId?: string;
  email?: string | null;
  legalName?: string | null;
  displayName?: string | null;
  accountNumber?: string | null;
};

type DepositRecord = {
  id?: string;
  status?: string;
  amountMinor?: string;
  currency?: string;
  provider?: string;
  providerIntentId?: string;
  fundingAsset?: string | null;
  fundingNetwork?: string | null;
  transactionHash?: string | null;
  customerNote?: string | null;
  evidenceUrl?: string | null;
  walletAddress?: string | null;
  createdAt?: string;
  updatedAt?: string;
  autoInvest?: {
    investmentId?: string | null;
    planSlug?: string | null;
    planName?: string | null;
    status?: string | null;
  } | null;
};

type WithdrawalRecord = {
  id?: string;
  status?: string;
  amountMinor?: string;
  currency?: string;
  provider?: string | null;
  providerPayoutReference?: string | null;
  destinationType?: string;
  destinationReference?: string;
  reviewReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
  paidAt?: string | null;
};

export function DepositDetailPanel() {
  return <FinancialDetailView kind="deposit" />;
}

export function WithdrawalDetailPanel() {
  return <FinancialDetailView kind="withdrawal" />;
}

function FinancialDetailView({ kind }: { kind: "deposit" | "withdrawal" }) {
  const params = useParams<{ depositId?: string; withdrawalId?: string }>();
  const router = useRouter();
  const id = kind === "deposit" ? params.depositId : params.withdrawalId;
  const listHref = kind === "deposit" ? "/admin/deposits" : "/admin/withdrawals";
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState<{ message: string; status?: number } | null>(null);
  const [deposit, setDeposit] = useState<DepositRecord | null>(null);
  const [withdrawal, setWithdrawal] = useState<WithdrawalRecord | null>(null);
  const [customer, setCustomer] = useState<CustomerSummary | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<"approve" | "reject" | "complete" | null>(
    null,
  );
  const [outcome, setOutcome] = useState<"approve" | "reject" | null>(null);
  const [proofOpen, setProofOpen] = useState(false);
  const [showFullWallet, setShowFullWallet] = useState(false);
  const [walletCopied, setWalletCopied] = useState(false);

  const [autoInvestOutcome, setAutoInvestOutcome] = useState<{
    planName?: string | null;
    investmentId?: string | null;
    status?: string | null;
  } | null>(null);

  const base = kind === "deposit" ? `/api/admin/deposits/${id}` : `/api/admin/withdrawals/${id}`;

  const load = useCallback(async () => {
    const result = await getAdminJson<{
      deposit?: DepositRecord;
      withdrawal?: WithdrawalRecord;
      customer?: CustomerSummary;
    }>(base);
    if (result.error) {
      setError({
        message: friendlyClientError(result.error),
        ...(result.status ? { status: result.status } : {}),
      });
      setState("error");
      return;
    }
    setDeposit(result.data?.deposit ?? null);
    setWithdrawal(result.data?.withdrawal ?? null);
    setCustomer(result.data?.customer ?? null);
    setState("ready");
  }, [base]);

  useEffect(() => {
    void load();
  }, [load]);

  async function runAction() {
    if (!confirmAction) return;
    const trimmed = reason.trim();
    if (!trimmed) {
      setFeedback("Please explain why you approved or rejected this request.");
      setConfirmAction(null);
      return;
    }
    setBusy(true);
    setFeedback(null);
    const path = confirmAction === "complete" ? `${base}/complete` : `${base}/${confirmAction}`;
    const result = await mutateAdminJson<{
      depositIntent?: DepositRecord;
      autoInvest?: {
        planName?: string;
        investmentId?: string;
        status?: string;
      } | null;
    }>("POST", path, { reason: trimmed });
    setBusy(false);
    setConfirmAction(null);
    if (result.error) {
      setFeedback(friendlyClientError(result.error));
      return;
    }
    if (confirmAction === "approve" || confirmAction === "reject") {
      if (kind === "deposit" && confirmAction === "approve") {
        setAutoInvestOutcome(
          result.data?.autoInvest ?? result.data?.depositIntent?.autoInvest ?? null,
        );
        if (result.data?.depositIntent) {
          setDeposit(result.data.depositIntent);
        }
      }
      setOutcome(confirmAction);
      return;
    }
    setFeedback("Marked as completed.");
    setReason("");
    await load();
  }

  if (state === "loading") return <AdminLoadingBlock />;
  if (state === "error" && error) {
    return (
      <AdminErrorBlock
        message={error.message}
        {...(error.status ? { status: error.status } : {})}
        onRetry={() => {
          setState("loading");
          void load();
        }}
      />
    );
  }

  const status = String(kind === "deposit" ? (deposit?.status ?? "") : (withdrawal?.status ?? ""));
  const amount = formatUsdFromMinor(
    kind === "deposit" ? deposit?.amountMinor : withdrawal?.amountMinor,
  );
  const currency = String(
    kind === "deposit" ? (deposit?.currency ?? "USD") : (withdrawal?.currency ?? "USD"),
  );
  const customerName =
    customer?.legalName?.trim() || customer?.displayName?.trim() || "Not provided";
  const username = customer?.displayName?.trim() || "Not provided";
  const email = customer?.email?.trim() || "Not provided";
  const customerId = customer?.accountNumber?.trim() || "Not assigned";
  const canDecide =
    kind === "deposit"
      ? status === "pending" || status === "created" || status === "under_review"
      : status === "under_review" || status === "requested" || status === "pending";

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={kind === "deposit" ? "Deposit Review" : "Withdrawal Review"}
        description={
          kind === "deposit"
            ? "Review the customer's deposit and approve or reject it."
            : "Review the customer's withdrawal request and take action."
        }
        action={
          <Button asChild type="button" variant="outline">
            <Link href={listHref}>
              {kind === "deposit" ? "Back to Deposits" : "Back to Withdrawals"}
            </Link>
          </Button>
        }
      />

      <div>
        <AdminStatusBadge status={status || "unknown"} />
      </div>

      {feedback ? (
        <Alert>
          <AlertDescription>{feedback}</AlertDescription>
        </Alert>
      ) : null}

      <AdminInfoSection title="Customer Information">
        <AdminInfoRow label="Customer Name" value={customerName} />
        <AdminInfoRow label="Username" value={username} />
        <AdminInfoRow label="Email Address" value={email} />
        <AdminInfoRow label="Customer ID" value={customerId} />
      </AdminInfoSection>

      {kind === "deposit" ? (
        <AdminInfoSection title="Deposit Information">
          <AdminInfoRow label="Approved Amount" value={amount} emphasize />
          <AdminInfoRow label="Currency" value={currency} />
          <AdminInfoRow label="Funding Method" value={fundingMethodLabel(deposit?.provider)} />
          <AdminInfoRow label="Asset" value={deposit?.fundingAsset || "—"} />
          <AdminInfoRow label="Network" value={deposit?.fundingNetwork || "—"} />
          <AdminInfoRow label="Wallet Used" value={deposit?.walletAddress || "—"} mono />
          <AdminInfoRow label="Transaction Hash" value={deposit?.transactionHash || "—"} mono />
          <AdminInfoRow label="Submitted" value={formatAdminDateTime(deposit?.createdAt)} />
          <AdminInfoRow label="Reference" value={deposit?.providerIntentId || "—"} mono />
        </AdminInfoSection>
      ) : null}

      {kind === "deposit" && (deposit?.autoInvest || status === "confirmed") ? (
        <AdminInfoSection title="Automatic Investment">
          <AdminInfoRow
            label="Assigned Plan"
            value={deposit?.autoInvest?.planName || "—"}
            emphasize
          />
          <AdminInfoRow
            label="Investment Created"
            value={deposit?.autoInvest?.investmentId ? "Yes" : status === "confirmed" ? "—" : "No"}
          />
          <AdminInfoRow
            label="Investment Started"
            value={deposit?.autoInvest?.investmentId ? "Yes" : "—"}
          />
          <AdminInfoRow
            label="Current Status"
            value={
              deposit?.autoInvest?.status ||
              (status === "confirmed" ? "CONFIRMED" : status.toUpperCase())
            }
          />
        </AdminInfoSection>
      ) : null}

      {kind === "deposit" ? null : (
        <AdminInfoSection title="Withdrawal Information">
          <AdminInfoRow label="Withdrawal Amount" value={amount} emphasize />
          <AdminInfoRow label="Currency" value={currency} />
          {(() => {
            const destination = parseWithdrawalDestination(
              withdrawal?.destinationType,
              withdrawal?.destinationReference,
            );
            if (destination.kind === "crypto") {
              return (
                <>
                  <AdminInfoRow label="Withdrawal Method" value={destination.methodLabel} />
                  <AdminInfoRow label="Network" value={destination.networkLabel} />
                  <AdminInfoRow
                    label="Wallet Address"
                    value={
                      <div className="space-y-2">
                        <p className="break-all font-mono text-xs">
                          {showFullWallet
                            ? destination.address
                            : shortenWalletAddress(destination.address)}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              void navigator.clipboard.writeText(destination.address).then(() => {
                                setWalletCopied(true);
                                window.setTimeout(() => setWalletCopied(false), 2000);
                              });
                            }}
                          >
                            {walletCopied ? "Copied" : "Copy Address"}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowFullWallet((value) => !value)}
                          >
                            {showFullWallet ? "Hide Full Address" : "Show Full Address"}
                          </Button>
                        </div>
                      </div>
                    }
                  />
                </>
              );
            }
            if (destination.kind === "bank") {
              return (
                <>
                  <AdminInfoRow label="Withdrawal Method" value="Bank Transfer" />
                  <AdminInfoRow label="Bank Name" value={destination.bankName} />
                  <AdminInfoRow label="Account Name" value={destination.accountName} />
                  <AdminInfoRow label="Account Number" value={destination.accountNumber} />
                </>
              );
            }
            return <AdminInfoRow label="Destination" value={destination.summary} />;
          })()}
          <AdminInfoRow label="Submitted" value={formatAdminDateTime(withdrawal?.createdAt)} />
          <AdminInfoRow label="Reference" value={withdrawal?.providerPayoutReference || "—"} mono />
          {withdrawal?.reviewReason ? (
            <AdminInfoRow label="Reason" value={withdrawal.reviewReason} />
          ) : null}
          {withdrawal?.paidAt ? (
            <AdminInfoRow label="Completed" value={formatAdminDateTime(withdrawal.paidAt)} />
          ) : null}
        </AdminInfoSection>
      )}

      {kind === "deposit" ? (
        <AdminInfoSection title="Customer Note">
          <p className="text-sm whitespace-pre-wrap text-foreground">
            {deposit?.customerNote?.trim() || "No note submitted."}
          </p>
        </AdminInfoSection>
      ) : null}

      {kind === "deposit" ? (
        <AdminInfoSection title="Uploaded Proof">
          {deposit?.evidenceUrl ? (
            <button
              type="button"
              className="block max-w-md overflow-hidden rounded-xl border border-border/70 bg-muted/20 text-left transition hover:opacity-90"
              onClick={() => setProofOpen(true)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={deposit.evidenceUrl}
                alt="Uploaded deposit proof"
                className="max-h-80 w-full object-contain"
              />
              <span className="block px-3 py-2 text-xs text-muted-foreground">
                Click to enlarge
              </span>
            </button>
          ) : (
            <p className="text-sm text-muted-foreground">No proof uploaded.</p>
          )}
        </AdminInfoSection>
      ) : null}

      {canDecide || kind === "withdrawal" ? (
        <Card className="space-y-4 p-5">
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            Decision
          </h2>
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">
              {kind === "withdrawal" ? "Admin Notes" : "Review Notes"}
            </span>
            <span className="text-xs text-muted-foreground">Reason (Required)</span>
            <Textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={4}
              placeholder={
                kind === "withdrawal"
                  ? "Explain why you approved or rejected this withdrawal."
                  : "Explain why you approved or rejected this deposit."
              }
              aria-label={kind === "withdrawal" ? "Admin notes" : "Review notes"}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {canDecide ? (
              <>
                <Button
                  type="button"
                  disabled={busy || !reason.trim()}
                  onClick={() => setConfirmAction("approve")}
                >
                  {kind === "deposit" ? "Approve Deposit" : "Approve Withdrawal"}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={busy || !reason.trim()}
                  onClick={() => setConfirmAction("reject")}
                >
                  {kind === "deposit" ? "Reject Deposit" : "Reject Withdrawal"}
                </Button>
              </>
            ) : null}
            {kind === "withdrawal" && status === "approved" ? (
              <Button
                type="button"
                variant="outline"
                disabled={busy || !reason.trim()}
                onClick={() => setConfirmAction("complete")}
              >
                Mark as Completed
              </Button>
            ) : null}
            <Button asChild type="button" variant="ghost">
              <Link href={listHref}>
                {kind === "deposit" ? "Back to Deposits" : "Back to Withdrawals"}
              </Link>
            </Button>
          </div>
        </Card>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button asChild type="button" variant="outline">
            <Link href={listHref}>
              {kind === "deposit" ? "Back to Deposits" : "Back to Withdrawals"}
            </Link>
          </Button>
        </div>
      )}

      <Dialog
        open={confirmAction !== null}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction === "approve"
                ? kind === "deposit"
                  ? "Approve this deposit?"
                  : "Approve this withdrawal?"
                : confirmAction === "reject"
                  ? kind === "deposit"
                    ? "Reject this deposit?"
                    : "Reject this withdrawal?"
                  : "Mark this withdrawal as paid?"}
            </DialogTitle>
            <DialogDescription>
              {confirmAction === "approve"
                ? "The customer's balance will be updated according to this decision."
                : confirmAction === "reject"
                  ? "The customer will be notified of this decision."
                  : "Confirm that payment to the customer has been completed."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmAction(null)}>
              Cancel
            </Button>
            <Button type="button" disabled={busy} onClick={() => void runAction()}>
              {busy ? "Working…" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={outcome !== null} onOpenChange={() => undefined}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {outcome === "approve"
                ? kind === "deposit"
                  ? "Deposit Approved"
                  : "Withdrawal Approved"
                : kind === "deposit"
                  ? "Deposit Rejected"
                  : "Withdrawal Rejected"}
            </DialogTitle>
            <DialogDescription>
              {outcome === "approve"
                ? kind === "deposit"
                  ? autoInvestOutcome?.planName
                    ? `Wallet credited and investment started automatically on ${autoInvestOutcome.planName}. Status: AUTO INVESTED.`
                    : "The customer's wallet has been credited successfully. A confirmation email has been sent."
                  : "The withdrawal has been approved. Continue processing according to your payout steps."
                : "The customer has been notified of the decision."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" onClick={() => router.push(listHref)}>
              {kind === "deposit" ? "Return to Deposits" : "Return to Withdrawals"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={proofOpen} onOpenChange={setProofOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Uploaded Proof</DialogTitle>
            <DialogDescription>Customer-submitted deposit screenshot.</DialogDescription>
          </DialogHeader>
          {deposit?.evidenceUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={deposit.evidenceUrl}
              alt="Uploaded deposit proof enlarged"
              className="max-h-[70vh] w-full object-contain"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
