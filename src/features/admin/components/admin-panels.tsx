"use client";

/* Admin list/detail panels fetch certified admin APIs after mount.
   Loading state updates happen in async continuations equivalent to the customer shell pattern. */
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Card,
  Input,
  StatusChip,
  Textarea,
} from "@/components/ui";
import { DashboardPanelCard } from "@/components/ui/dashboard-panel-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { getAdminJson, mutateAdminFormData, mutateAdminJson } from "../api-client";
import { AdminDataTable, AdminMetricGrid, AdminToolbar } from "./admin-data-table";
import {
  AdminEmptyBlock,
  AdminErrorBlock,
  AdminLoadingBlock,
  AdminPageHeader,
} from "./admin-states";

type LoadState = "loading" | "ready" | "error";

export function OverviewPanel() {
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState<{ message: string; status?: number } | null>(null);
  const [metrics, setMetrics] = useState<{
    pendingDeposits: number;
    pendingWithdrawals: number;
    underReviewWithdrawals: number;
    depositsToday: number;
    withdrawalsToday: number;
    pendingReviews: number;
    failedJobs: number;
    failedWebhooks: number;
    deadLetteredWebhooks: number;
  } | null>(null);
  const [activity, setActivity] = useState<
    Array<{ id: string; action: string; targetType: string; createdAt: string }>
  >([]);

  const load = useCallback(async () => {
    const result = await getAdminJson<{
      pendingDeposits: number;
      pendingWithdrawals: number;
      underReviewWithdrawals: number;
      depositsToday: number;
      withdrawalsToday: number;
      pendingReviews: number;
      failedJobs: number;
      failedWebhooks: number;
      deadLetteredWebhooks: number;
      recentActivity: Array<{
        id: string;
        action: string;
        targetType: string;
        createdAt: string;
      }>;
    }>("/api/admin/overview");
    if (result.error) {
      setError({ message: result.error, ...(result.status ? { status: result.status } : {}) });
      setState("error");
      return;
    }
    setMetrics({
      pendingDeposits: result.data?.pendingDeposits ?? 0,
      pendingWithdrawals: result.data?.pendingWithdrawals ?? 0,
      underReviewWithdrawals: result.data?.underReviewWithdrawals ?? 0,
      depositsToday: result.data?.depositsToday ?? 0,
      withdrawalsToday: result.data?.withdrawalsToday ?? 0,
      pendingReviews: result.data?.pendingReviews ?? 0,
      failedJobs: result.data?.failedJobs ?? 0,
      failedWebhooks: result.data?.failedWebhooks ?? 0,
      deadLetteredWebhooks: result.data?.deadLetteredWebhooks ?? 0,
    });
    setActivity(result.data?.recentActivity ?? []);
    setState("ready");
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (state === "loading") return <AdminLoadingBlock label="Loading overview" />;
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
  if (!metrics)
    return (
      <AdminEmptyBlock
        title="No overview data"
        description="Operational metrics are unavailable."
      />
    );

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Executive dashboard"
        description="Live operational snapshot across customers, money movement, and system health."
      />

      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Operations queue
        </h2>
        <AdminMetricGrid
          metrics={[
            {
              label: "Pending deposits",
              value: metrics.pendingDeposits,
              href: "/admin/deposits",
              accent: "sky",
            },
            {
              label: "Pending withdrawals",
              value: metrics.pendingWithdrawals,
              href: "/admin/withdrawals",
              accent: "rose",
            },
            {
              label: "Under review withdrawals",
              value: metrics.underReviewWithdrawals,
              href: "/admin/withdrawals",
              accent: "amber",
            },
            {
              label: "Pending reviews",
              value: metrics.pendingReviews,
              href: "/admin/deposits",
              accent: "primary",
            },
          ]}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Today
        </h2>
        <AdminMetricGrid
          metrics={[
            {
              label: "Deposits today",
              value: metrics.depositsToday,
              href: "/admin/deposits",
              accent: "emerald",
            },
            {
              label: "Withdrawals today",
              value: metrics.withdrawalsToday,
              href: "/admin/withdrawals",
              accent: "violet",
            },
            {
              label: "Failed jobs",
              value: metrics.failedJobs,
              href: "/admin/jobs",
              accent: "slate",
            },
            {
              label: "Failed webhooks",
              value: metrics.failedWebhooks,
              href: "/admin/system",
              accent: "amber",
            },
          ]}
        />
      </section>

      <DashboardPanelCard
        title="Recent administrative activity"
        href="/admin/security"
        accent="slate"
      >
        {activity.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent administrative activity.</p>
        ) : (
          <div className="space-y-2">
            {activity.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/40 bg-muted/20 px-4 py-2.5 text-sm"
              >
                <div className="min-w-0">
                  <span className="font-medium capitalize">{item.action}</span>
                  <span className="text-muted-foreground"> · {item.targetType}</span>
                </div>
                <time className="shrink-0 text-xs text-muted-foreground" dateTime={item.createdAt}>
                  {new Date(item.createdAt).toLocaleString()}
                </time>
              </div>
            ))}
          </div>
        )}
      </DashboardPanelCard>
    </div>
  );
}

export function CustomersPanel() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState<{ message: string; status?: number } | null>(null);
  const [rows, setRows] = useState<
    Array<{
      id: string;
      name: string;
      email: string;
      status: string;
      kycStatus: string;
      createdAt: string;
    }>
  >([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkFeedback, setBulkFeedback] = useState<string | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleteConfirmation, setBulkDeleteConfirmation] = useState("");
  const [pendingBulkAction, setPendingBulkAction] = useState<
    "suspend" | "reactivate" | "lock" | "unlock" | "delete" | null
  >(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (status !== "all") params.set("status", status);
    params.set("limit", "50");
    const result = await getAdminJson<{
      customers: Array<{
        userId: string;
        email: string;
        displayName?: string | null;
        legalName?: string | null;
        accountStatus?: string | null;
        userStatus?: string;
        kycStatus?: string | null;
        userCreatedAt: string;
      }>;
    }>(`/api/admin/users?${params.toString()}`);
    if (result.error) {
      setError({ message: result.error, ...(result.status ? { status: result.status } : {}) });
      setState("error");
      return;
    }
    setRows(
      (result.data?.customers ?? []).map((row) => {
        const name =
          row.displayName?.trim() ||
          row.legalName?.trim() ||
          row.email.split("@")[0] ||
          "Unknown customer";
        return {
          id: row.userId,
          name,
          email: row.email,
          status: row.accountStatus ?? row.userStatus ?? "unknown",
          kycStatus: row.kycStatus ?? "unknown",
          createdAt: row.userCreatedAt,
        };
      }),
    );
    setState("ready");
  }, [q, status]);

  useEffect(() => {
    void load();
  }, [load]);

  async function runBulkAction(action: "suspend" | "reactivate" | "lock" | "unlock" | "delete") {
    const userIds = [...selected];
    if (userIds.length === 0) return;

    if (action === "delete") {
      setPendingBulkAction("delete");
      setBulkDeleteConfirmation("");
      setBulkDeleteOpen(true);
      return;
    }

    setBulkBusy(true);
    setBulkFeedback(null);
    const result = await mutateAdminJson<{
      succeeded: string[];
      failed: Array<{ userId: string; message: string }>;
    }>("POST", "/api/admin/users/bulk", {
      action,
      userIds,
      reason:
        action === "suspend"
          ? "Administrative suspension"
          : action === "lock"
            ? "Administrative lock"
            : "Administrative reactivation",
    });
    setBulkBusy(false);
    if (result.error) {
      setBulkFeedback(result.error);
      return;
    }
    const succeeded = result.data?.succeeded.length ?? 0;
    const failedRows = result.data?.failed ?? [];
    const failed = failedRows.length;
    const failureDetail =
      failedRows.length > 0
        ? ` ${failedRows
            .slice(0, 3)
            .map((row) => row.message)
            .join(" · ")}${failedRows.length > 3 ? "…" : ""}`
        : "";
    setBulkFeedback(
      failed > 0
        ? `${action} applied to ${succeeded} customer(s); ${failed} failed.${failureDetail}`
        : `${action} applied to ${succeeded} customer(s).`,
    );
    setSelected(new Set());
    await load();
  }

  async function confirmBulkDelete() {
    const userIds = [...selected];
    if (userIds.length === 0) return;
    setBulkBusy(true);
    setBulkFeedback(null);
    const result = await mutateAdminJson<{
      succeeded: string[];
      failed: Array<{ userId: string; message: string }>;
    }>("POST", "/api/admin/users/bulk", {
      action: "delete",
      userIds,
      confirmation: bulkDeleteConfirmation,
    });
    setBulkBusy(false);
    setBulkDeleteOpen(false);
    setPendingBulkAction(null);
    if (result.error) {
      setBulkFeedback(result.error);
      return;
    }
    const succeeded = result.data?.succeeded.length ?? 0;
    const failedRows = result.data?.failed ?? [];
    const failed = failedRows.length;
    const failureDetail =
      failedRows.length > 0
        ? ` ${failedRows
            .slice(0, 3)
            .map((row) => row.message)
            .join(" · ")}${failedRows.length > 3 ? "…" : ""}`
        : "";
    setBulkFeedback(
      failed > 0
        ? `Deleted ${succeeded} customer(s); ${failed} failed.${failureDetail}`
        : `Deleted ${succeeded} customer(s). Their emails can register again.`,
    );
    setSelected(new Set());
    setBulkDeleteConfirmation("");
    await load();
  }

  return (
    <div>
      <AdminPageHeader
        title="Customers"
        description="Search, filter, and open customer administration records. Select rows to suspend, reactivate, lock, unlock, or delete."
        action={
          <Button asChild type="button">
            <Link href="/admin/customers/new">Create customer</Link>
          </Button>
        }
      />
      {bulkFeedback ? (
        <p className="mb-4 rounded-md border bg-card px-3 py-2 text-sm" role="status">
          {bulkFeedback}
        </p>
      ) : null}
      {selected.size > 0 ? (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-3">
          <span className="text-sm font-semibold text-foreground">{selected.size} selected</span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={bulkBusy}
            onClick={() => void runBulkAction("suspend")}
          >
            Suspend
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={bulkBusy}
            onClick={() => void runBulkAction("reactivate")}
          >
            Reactivate
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={bulkBusy}
            onClick={() => void runBulkAction("lock")}
          >
            Lock
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={bulkBusy}
            onClick={() => void runBulkAction("unlock")}
          >
            Unlock
          </Button>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            disabled={bulkBusy}
            onClick={() => void runBulkAction("delete")}
          >
            Delete
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={bulkBusy}
            onClick={() => setSelected(new Set())}
          >
            Clear selection
          </Button>
        </div>
      ) : null}
      <AdminToolbar
        searchLabel="Search customers"
        searchValue={q}
        onSearchChange={setQ}
        statusLabel="Account status"
        statusValue={status}
        statusOptions={[
          { value: "active", label: "Active" },
          { value: "restricted", label: "Restricted" },
          { value: "closed", label: "Closed" },
        ]}
        onStatusChange={setStatus}
        trailing={
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setState("loading");
              void load();
            }}
          >
            Refresh
          </Button>
        }
      />
      {state === "loading" ? <AdminLoadingBlock /> : null}
      {state === "error" && error ? (
        <AdminErrorBlock
          message={error.message}
          {...(error.status ? { status: error.status } : {})}
          onRetry={() => {
            setState("loading");
            void load();
          }}
        />
      ) : null}
      {state === "ready" && rows.length === 0 ? (
        <AdminEmptyBlock title="No customers found" description="Adjust filters or search terms." />
      ) : null}
      {state === "ready" && rows.length > 0 ? (
        <AdminDataTable
          caption="Customer search results"
          selectable
          selectedIds={selected}
          onToggleAll={(checked) =>
            setSelected(checked ? new Set(rows.map((row) => row.id)) : new Set())
          }
          onToggleRow={(id, checked) => {
            setSelected((current) => {
              const next = new Set(current);
              if (checked) next.add(id);
              else next.delete(id);
              return next;
            });
          }}
          columns={[
            {
              key: "name",
              header: "Customer",
              cell: (row) => (
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{row.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{row.email}</p>
                </div>
              ),
            },
            {
              key: "status",
              header: "Status",
              cell: (row) => <StatusChip tone="neutral">{row.status}</StatusChip>,
            },
            { key: "kyc", header: "KYC", cell: (row) => row.kycStatus },
            {
              key: "created",
              header: "Created",
              cell: (row) => new Date(row.createdAt).toLocaleDateString(),
            },
          ]}
          rows={rows}
          rowActions={(row) => (
            <Button asChild size="sm" variant="ghost">
              <Link href={`/admin/customers/${row.id}`}>Open</Link>
            </Button>
          )}
        />
      ) : null}

      <Dialog
        open={bulkDeleteOpen}
        onOpenChange={(open) => {
          setBulkDeleteOpen(open);
          if (!open) {
            setPendingBulkAction(null);
            setBulkDeleteConfirmation("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selected.size} customer(s)?</DialogTitle>
            <DialogDescription>
              This permanently deletes the selected customers and all of their application data
              (profile, wallet, deposits, withdrawals, investments, notifications). Their email can
              register again. Type DELETE to confirm. Staff accounts and your own admin account
              cannot be deleted here.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={bulkDeleteConfirmation}
            onChange={(event) => setBulkDeleteConfirmation(event.target.value)}
            aria-label="Type DELETE to confirm"
            placeholder="DELETE"
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setBulkDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={bulkBusy || bulkDeleteConfirmation !== "DELETE" || !pendingBulkAction}
              onClick={() => void confirmBulkDelete()}
            >
              {bulkBusy ? "Deleting…" : "Delete selected"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function CustomerDetailPanel() {
  const params = useParams<{ userId: string }>();
  const router = useRouter();
  const userId = params.userId;
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState<{ message: string; status?: number } | null>(null);
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [note, setNote] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<"active" | "suspended" | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [walletAmount, setWalletAmount] = useState("");
  const [walletReason, setWalletReason] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const load = useCallback(async () => {
    const result = await getAdminJson<Record<string, unknown>>(`/api/admin/users/${userId}`);
    if (result.error) {
      setError({ message: result.error, ...(result.status ? { status: result.status } : {}) });
      setState("error");
      return;
    }
    setDetail(result.data ?? null);
    const profile = result.data?.profile as { displayName?: string; phone?: string } | undefined;
    setDisplayName(profile?.displayName ?? "");
    setPhone(profile?.phone ?? "");
    setState("ready");
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submitNote() {
    if (!note.trim()) return;
    setBusy(true);
    const result = await mutateAdminJson("POST", `/api/admin/users/${userId}/notes`, {
      body: note.trim(),
    });
    setBusy(false);
    if (result.error) {
      setFeedback(result.error);
      return;
    }
    setNote("");
    setFeedback("Note added.");
    await load();
  }

  async function confirmStatus() {
    if (!pendingStatus) return;
    setBusy(true);
    const result = await mutateAdminJson("PATCH", `/api/admin/users/${userId}/status`, {
      status: pendingStatus,
      reason:
        pendingStatus === "suspended" ? "Administrative suspension" : "Administrative reactivation",
    });
    setBusy(false);
    setConfirmOpen(false);
    if (result.error) {
      setFeedback(result.error);
      return;
    }
    setFeedback("Customer status updated.");
    await load();
  }

  async function saveProfile() {
    setBusy(true);
    const result = await mutateAdminJson("PATCH", `/api/admin/users/${userId}`, {
      displayName: displayName.trim() || null,
      phone: phone.trim() || null,
    });
    setBusy(false);
    if (result.error) {
      setFeedback(result.error);
      return;
    }
    setFeedback("Customer profile updated.");
    await load();
  }

  async function runAction(
    method: "POST" | "DELETE",
    path: string,
    body?: Record<string, unknown>,
    successMessage?: string,
  ) {
    setBusy(true);
    const result = await mutateAdminJson(method, path, body);
    setBusy(false);
    if (result.error) {
      setFeedback(result.error);
      return;
    }
    setFeedback(successMessage ?? "Action completed.");
    if (method === "DELETE") {
      router.push("/admin/customers");
      return;
    }
    await load();
  }

  async function adjustWallet(direction: "credit" | "debit") {
    const cents = Math.round(Number(walletAmount) * 100);
    if (!Number.isFinite(cents) || cents <= 0 || !walletReason.trim()) {
      setFeedback("Enter a positive amount and reason.");
      return;
    }
    setBusy(true);
    const result = await mutateAdminJson("POST", `/api/admin/users/${userId}/wallet/${direction}`, {
      amountMinor: String(cents),
      currency: "USD",
      reason: walletReason.trim(),
    });
    setBusy(false);
    if (result.error) {
      setFeedback(result.error);
      return;
    }
    setWalletAmount("");
    setWalletReason("");
    setFeedback(`Wallet ${direction} posted to ledger.`);
  }

  if (state === "loading") return <AdminLoadingBlock label="Loading customer" />;
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
  if (!detail) return <AdminEmptyBlock title="Customer not found" />;

  const user = detail.user as { email?: string; status?: string } | undefined;
  const profile = detail.profile as { kycStatus?: string; displayName?: string } | undefined;

  return (
    <div>
      <AdminPageHeader
        title={profile?.displayName ?? user?.email ?? "Customer"}
        description="Customer administration for certified account records."
        action={
          <Button type="button" variant="outline" onClick={() => router.push("/admin/customers")}>
            Back
          </Button>
        }
      />
      {feedback ? (
        <p className="mb-4 rounded-md border bg-card px-3 py-2 text-sm" role="status">
          {feedback}
        </p>
      ) : null}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground uppercase">Email</p>
          <p className="mt-1 text-sm font-medium">{user?.email ?? "—"}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground uppercase">Status</p>
          <p className="mt-1 text-sm font-medium">{user?.status ?? "—"}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground uppercase">KYC</p>
          <p className="mt-1 text-sm font-medium">{profile?.kycStatus ?? "—"}</p>
        </Card>
      </div>
      <div className="mb-6 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="destructive"
          disabled={busy}
          onClick={() => {
            setPendingStatus("suspended");
            setConfirmOpen(true);
          }}
        >
          Suspend
        </Button>
        <Button
          type="button"
          disabled={busy}
          onClick={() => {
            setPendingStatus("active");
            setConfirmOpen(true);
          }}
        >
          Reactivate
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() =>
            void runAction(
              "POST",
              `/api/admin/users/${userId}/lock`,
              {
                reason: "Administrative lock",
              },
              "Account locked.",
            )
          }
        >
          Lock
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() =>
            void runAction(
              "POST",
              `/api/admin/users/${userId}/unlock`,
              undefined,
              "Account unlocked.",
            )
          }
        >
          Unlock
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() =>
            void runAction(
              "POST",
              `/api/admin/users/${userId}/reset-password`,
              undefined,
              "Temporary password emailed.",
            )
          }
        >
          Reset password
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() =>
            void runAction(
              "POST",
              `/api/admin/users/${userId}/force-password-change`,
              undefined,
              "Password change required on next login.",
            )
          }
        >
          Force password change
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={busy}
          onClick={() => setDeleteOpen(true)}
        >
          Delete
        </Button>
      </div>
      <Card className="mb-6 space-y-3 p-4">
        <h2 className="text-sm font-semibold">Edit profile</h2>
        <Input
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          aria-label="Display name"
          placeholder="Display name"
        />
        <Input
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          aria-label="Phone"
          placeholder="Phone"
        />
        <Button type="button" disabled={busy} onClick={() => void saveProfile()}>
          {busy ? "Saving…" : "Save profile"}
        </Button>
      </Card>
      <Card className="mb-6 space-y-3 p-4">
        <h2 className="text-sm font-semibold">Wallet adjustment (ledger)</h2>
        <Input
          value={walletAmount}
          onChange={(event) => setWalletAmount(event.target.value)}
          aria-label="Amount USD"
          placeholder="Amount in USD (e.g. 25.00)"
        />
        <Input
          value={walletReason}
          onChange={(event) => setWalletReason(event.target.value)}
          aria-label="Adjustment reason"
          placeholder="Reason (required)"
        />
        <div className="flex flex-wrap gap-2">
          <Button type="button" disabled={busy} onClick={() => void adjustWallet("credit")}>
            Credit wallet
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => void adjustWallet("debit")}
          >
            Debit wallet
          </Button>
        </div>
      </Card>
      <Card className="space-y-3 p-4">
        <h2 className="text-sm font-semibold">Add note</h2>
        <Textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          aria-label="Customer note"
          placeholder="Internal note visible to administrators"
        />
        <Button type="button" disabled={busy || !note.trim()} onClick={() => void submitNote()}>
          {busy ? "Saving…" : "Save note"}
        </Button>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm status change</DialogTitle>
            <DialogDescription>
              This updates the customer account status through the certified admin customer service.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={busy} onClick={() => void confirmStatus()}>
              {busy ? "Updating…" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete customer</DialogTitle>
            <DialogDescription>
              This permanently deletes the customer and all of their application data (profile,
              wallet, deposits, withdrawals, investments, notifications). Their email can register
              again afterward. Type DELETE to confirm. You cannot delete your own administrator
              account.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={deleteConfirmation}
            onChange={(event) => setDeleteConfirmation(event.target.value)}
            aria-label="Delete confirmation"
            placeholder="Type DELETE"
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={busy || deleteConfirmation !== "DELETE"}
              onClick={() =>
                void runAction(
                  "DELETE",
                  `/api/admin/users/${userId}`,
                  {
                    confirmation: deleteConfirmation,
                  },
                  "Customer deleted. Their email can register again.",
                )
              }
            >
              {busy ? "Deleting…" : "Delete customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function useResourceList<T extends { id: string }>(
  endpoint: string,
  key: string,
  mapRow: (row: Record<string, unknown>) => T,
) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState<{ message: string; status?: number } | null>(null);
  const [rows, setRows] = useState<T[]>([]);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (status !== "all") params.set("status", status);
    params.set("limit", "50");
    const result = await getAdminJson<Record<string, unknown>>(`${endpoint}?${params.toString()}`);
    if (result.error) {
      setError({ message: result.error, ...(result.status ? { status: result.status } : {}) });
      setState("error");
      return;
    }
    const list = (result.data?.[key] as Array<Record<string, unknown>> | undefined) ?? [];
    setRows(list.map(mapRow));
    setState("ready");
  }, [endpoint, key, mapRow, q, status]);

  useEffect(() => {
    void load();
  }, [load]);

  return { q, setQ, status, setStatus, state, setState, error, rows, load };
}

type FundingWalletRow = {
  id: string;
  asset: string;
  network: string;
  address: string;
  status: string;
  qrCodeUrl: string | null;
  instructions: string | null;
  displayOrder: number;
};

const FUNDING_NETWORK_PRESETS: Record<string, string[]> = {
  BTC: ["Bitcoin"],
  ETH: ["ERC20"],
  USDT: ["TRC20", "ERC20", "BEP20"],
};

const EMPTY_FUNDING_WALLET_FORM = {
  asset: "USDT",
  network: "TRC20",
  address: "",
  qrCodeUrl: "",
  instructions: "",
  status: "active" as "active" | "disabled",
  displayOrder: 0,
};

export function FundingWalletsPanel() {
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState<{ message: string; status?: number } | null>(null);
  const [rows, setRows] = useState<FundingWalletRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FUNDING_WALLET_FORM);

  const load = useCallback(async () => {
    const result = await getAdminJson<{ wallets: FundingWalletRow[] }>(
      "/api/admin/funding-wallets",
    );
    if (result.error) {
      setError({ message: result.error, ...(result.status ? { status: result.status } : {}) });
      setState("error");
      return;
    }
    setRows(result.data?.wallets ?? []);
    setState("ready");
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function beginCreate() {
    setEditingId(null);
    setForm({ ...EMPTY_FUNDING_WALLET_FORM, displayOrder: rows.length });
  }

  function beginEdit(row: FundingWalletRow) {
    setEditingId(row.id);
    setForm({
      asset: row.asset,
      network: row.network,
      address: row.address,
      qrCodeUrl: row.qrCodeUrl ?? "",
      instructions: row.instructions ?? "",
      status: row.status === "disabled" ? "disabled" : "active",
      displayOrder: row.displayOrder,
    });
  }

  async function saveWallet() {
    setBusy(true);
    setFeedback(null);
    const body = {
      asset: form.asset,
      network: form.network.trim(),
      address: form.address.trim(),
      qrCodeUrl: form.qrCodeUrl.trim() || null,
      instructions: form.instructions.trim() || null,
      status: form.status,
      displayOrder: form.displayOrder,
    };
    const result = editingId
      ? await mutateAdminJson("PATCH", `/api/admin/funding-wallets/${editingId}`, body)
      : await mutateAdminJson("POST", "/api/admin/funding-wallets", body);
    setBusy(false);
    if (result.error) {
      setFeedback(result.error);
      return;
    }
    setFeedback(editingId ? "Funding wallet updated." : "Funding wallet saved.");
    beginCreate();
    await load();
  }

  async function toggleStatus(row: FundingWalletRow) {
    setBusy(true);
    setFeedback(null);
    const result = await mutateAdminJson("PATCH", `/api/admin/funding-wallets/${row.id}`, {
      asset: row.asset,
      network: row.network,
      address: row.address,
      qrCodeUrl: row.qrCodeUrl,
      instructions: row.instructions,
      status: row.status === "active" ? "disabled" : "active",
      displayOrder: row.displayOrder,
    });
    setBusy(false);
    if (result.error) {
      setFeedback(result.error);
      return;
    }
    await load();
  }

  async function deleteWallet(row: FundingWalletRow) {
    if (!window.confirm(`Delete ${row.asset} · ${row.network} wallet?`)) return;
    setBusy(true);
    setFeedback(null);
    const result = await mutateAdminJson("DELETE", `/api/admin/funding-wallets/${row.id}`);
    setBusy(false);
    if (result.error) {
      setFeedback(result.error);
      return;
    }
    if (editingId === row.id) beginCreate();
    setFeedback("Funding wallet deleted.");
    await load();
  }

  async function moveWallet(row: FundingWalletRow, direction: -1 | 1) {
    const ordered = [...rows].sort((a, b) => a.displayOrder - b.displayOrder);
    const index = ordered.findIndex((item) => item.id === row.id);
    const swapWith = ordered[index + direction];
    if (!swapWith) return;
    setBusy(true);
    setFeedback(null);
    const first = await mutateAdminJson("PATCH", `/api/admin/funding-wallets/${row.id}`, {
      asset: row.asset,
      network: row.network,
      address: row.address,
      qrCodeUrl: row.qrCodeUrl,
      instructions: row.instructions,
      status: row.status,
      displayOrder: swapWith.displayOrder,
    });
    if (first.error) {
      setBusy(false);
      setFeedback(first.error);
      return;
    }
    const second = await mutateAdminJson("PATCH", `/api/admin/funding-wallets/${swapWith.id}`, {
      asset: swapWith.asset,
      network: swapWith.network,
      address: swapWith.address,
      qrCodeUrl: swapWith.qrCodeUrl,
      instructions: swapWith.instructions,
      status: swapWith.status,
      displayOrder: row.displayOrder,
    });
    setBusy(false);
    if (second.error) {
      setFeedback(second.error);
      return;
    }
    await load();
  }

  async function uploadQr(file: File) {
    setBusy(true);
    setFeedback(null);
    const formData = new FormData();
    formData.set("file", file);
    const result = await mutateAdminFormData<{ url: string }>(
      "/api/admin/funding-wallets/upload-qr",
      formData,
    );
    setBusy(false);
    if (result.error || !result.data?.url) {
      setFeedback(result.error ?? "QR upload failed.");
      return;
    }
    setForm((current) => ({ ...current, qrCodeUrl: result.data!.url }));
    setFeedback("QR image uploaded.");
  }

  const networkOptions = FUNDING_NETWORK_PRESETS[form.asset] ?? ["Other"];

  return (
    <div>
      <AdminPageHeader
        title="Funding wallets"
        description="Configure BTC, ETH, and USDT receive addresses shown to customers for manual deposits."
      />
      {feedback ? (
        <p className="mb-4 rounded-md border bg-card px-3 py-2 text-sm" role="status">
          {feedback}
        </p>
      ) : null}
      <Card className="mb-6 space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">{editingId ? "Edit wallet" : "Add wallet"}</h2>
          {editingId ? (
            <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={beginCreate}>
              Cancel edit
            </Button>
          ) : null}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span>Asset</span>
            <select
              className="rounded-md border bg-background px-3 py-2"
              value={form.asset}
              onChange={(event) => {
                const nextAsset = event.target.value;
                const presets = FUNDING_NETWORK_PRESETS[nextAsset] ?? ["Other"];
                setForm((current) => ({
                  ...current,
                  asset: nextAsset,
                  network: presets[0] ?? current.network,
                }));
              }}
            >
              <option value="BTC">BTC</option>
              <option value="ETH">ETH</option>
              <option value="USDT">USDT</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span>Network</span>
            <select
              className="rounded-md border bg-background px-3 py-2"
              value={networkOptions.includes(form.network) ? form.network : "__custom__"}
              onChange={(event) => {
                const value = event.target.value;
                if (value === "__custom__") {
                  setForm((current) => ({ ...current, network: "" }));
                  return;
                }
                setForm((current) => ({ ...current, network: value }));
              }}
            >
              {networkOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
              <option value="__custom__">Custom…</option>
            </select>
            {!networkOptions.includes(form.network) ? (
              <Input
                className="mt-2"
                value={form.network}
                onChange={(event) =>
                  setForm((current) => ({ ...current, network: event.target.value }))
                }
                placeholder="Custom network"
              />
            ) : null}
          </label>
          <label className="grid gap-1 text-sm sm:col-span-2">
            <span>Address</span>
            <Input
              value={form.address}
              onChange={(event) =>
                setForm((current) => ({ ...current, address: event.target.value }))
              }
            />
          </label>
          <label className="grid gap-1 text-sm sm:col-span-2">
            <span>QR code</span>
            <Input
              value={form.qrCodeUrl}
              onChange={(event) =>
                setForm((current) => ({ ...current, qrCodeUrl: event.target.value }))
              }
              placeholder="https://… or upload below"
            />
            <Input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="mt-2"
              disabled={busy}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadQr(file);
                event.target.value = "";
              }}
            />
            {form.qrCodeUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.qrCodeUrl}
                alt="QR preview"
                className="mt-2 h-28 w-28 rounded-md border bg-white object-contain p-1"
              />
            ) : null}
          </label>
          <label className="grid gap-1 text-sm sm:col-span-2">
            <span>Instructions (optional)</span>
            <Textarea
              value={form.instructions}
              onChange={(event) =>
                setForm((current) => ({ ...current, instructions: event.target.value }))
              }
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span>Status</span>
            <select
              className="rounded-md border bg-background px-3 py-2"
              value={form.status}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  status: event.target.value === "disabled" ? "disabled" : "active",
                }))
              }
            >
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span>Display order</span>
            <Input
              type="number"
              min={0}
              value={form.displayOrder}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  displayOrder: Number(event.target.value) || 0,
                }))
              }
            />
          </label>
        </div>
        <Button
          type="button"
          disabled={busy || form.address.trim().length < 8 || form.network.trim().length < 1}
          onClick={() => void saveWallet()}
        >
          {busy ? "Saving…" : editingId ? "Update wallet" : "Save wallet"}
        </Button>
      </Card>
      {state === "loading" ? <AdminLoadingBlock /> : null}
      {state === "error" && error ? (
        <AdminErrorBlock
          message={error.message}
          {...(error.status ? { status: error.status } : {})}
          onRetry={() => {
            setState("loading");
            void load();
          }}
        />
      ) : null}
      {state === "ready" ? (
        <div className="space-y-3">
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No funding wallets configured yet.</p>
          ) : (
            [...rows]
              .sort((a, b) => a.displayOrder - b.displayOrder)
              .map((row, index, ordered) => (
                <Card key={row.id} className="space-y-2 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">
                        {row.asset} · {row.network}
                      </p>
                      <p className="break-all font-mono text-xs text-muted-foreground">
                        {row.address}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">Order {row.displayOrder}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusChip tone={row.status === "active" ? "active" : "neutral"}>
                        {row.status}
                      </StatusChip>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busy || index === 0}
                        onClick={() => void moveWallet(row, -1)}
                      >
                        Up
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busy || index === ordered.length - 1}
                        onClick={() => void moveWallet(row, 1)}
                      >
                        Down
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => beginEdit(row)}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => void toggleStatus(row)}
                      >
                        {row.status === "active" ? "Disable" : "Enable"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        disabled={busy}
                        onClick={() => void deleteWallet(row)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                  {row.qrCodeUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={row.qrCodeUrl}
                      alt={`${row.asset} QR`}
                      className="h-20 w-20 rounded-md border bg-white object-contain p-1"
                    />
                  ) : null}
                  {row.instructions ? (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {row.instructions}
                    </p>
                  ) : null}
                </Card>
              ))
          )}
        </div>
      ) : null}
    </div>
  );
}

export function DepositsPanel() {
  const mapRow = useCallback(
    (row: Record<string, unknown>) => ({
      id: String(row.id),
      reference: String(row.providerIntentId ?? row.id),
      status: String(row.status),
      amountMinor: String(row.amountMinor ?? "0"),
      createdAt: String(row.createdAt ?? ""),
    }),
    [],
  );
  const { q, setQ, status, setStatus, state, setState, error, rows, load } = useResourceList(
    "/api/admin/deposits",
    "deposits",
    mapRow,
  );

  return (
    <ResourceListPage
      title="Deposits"
      description="Review deposit intents through the certified deposit engine wrappers."
      searchLabel="Search deposits"
      q={q}
      setQ={setQ}
      status={status}
      setStatus={setStatus}
      statusOptions={[
        { value: "pending", label: "Pending" },
        { value: "confirmed", label: "Confirmed" },
        { value: "failed", label: "Failed" },
      ]}
      state={state}
      error={error}
      load={load}
      setState={setState}
      emptyTitle="No deposits found"
      rows={rows}
      detailHref={(id) => `/admin/deposits/${id}`}
      columns={[
        { key: "reference", header: "Reference", cell: (row) => row.reference },
        {
          key: "status",
          header: "Status",
          cell: (row) => <Badge variant="secondary">{row.status}</Badge>,
        },
        { key: "amount", header: "Amount (minor)", cell: (row) => row.amountMinor },
        {
          key: "created",
          header: "Created",
          cell: (row) => (row.createdAt ? new Date(row.createdAt).toLocaleString() : "—"),
        },
      ]}
    />
  );
}

export function WithdrawalsPanel() {
  const mapRow = useCallback(
    (row: Record<string, unknown>) => ({
      id: String(row.id),
      reference: String(row.providerPayoutReference ?? row.id),
      status: String(row.status),
      amountMinor: String(row.amountMinor ?? "0"),
      createdAt: String(row.createdAt ?? ""),
    }),
    [],
  );
  const { q, setQ, status, setStatus, state, setState, error, rows, load } = useResourceList(
    "/api/admin/withdrawals",
    "withdrawals",
    mapRow,
  );

  return (
    <ResourceListPage
      title="Withdrawals"
      description="Review withdrawal requests through the certified withdrawal engine wrappers."
      searchLabel="Search withdrawals"
      q={q}
      setQ={setQ}
      status={status}
      setStatus={setStatus}
      statusOptions={[
        { value: "under_review", label: "Under review" },
        { value: "approved", label: "Approved" },
        { value: "paid", label: "Paid" },
      ]}
      state={state}
      error={error}
      load={load}
      setState={setState}
      emptyTitle="No withdrawals found"
      rows={rows}
      detailHref={(id) => `/admin/withdrawals/${id}`}
      columns={[
        { key: "reference", header: "Reference", cell: (row) => row.reference },
        {
          key: "status",
          header: "Status",
          cell: (row) => <Badge variant="secondary">{row.status}</Badge>,
        },
        { key: "amount", header: "Amount (minor)", cell: (row) => row.amountMinor },
        {
          key: "created",
          header: "Created",
          cell: (row) => (row.createdAt ? new Date(row.createdAt).toLocaleString() : "—"),
        },
      ]}
    />
  );
}

export function InvestmentsPanel() {
  const mapRow = useCallback(
    (row: Record<string, unknown>) => ({
      id: String(row.id),
      reference: String(row.id),
      status: String(row.status),
      amountMinor: String(row.principalMinor ?? "0"),
      userId: String(row.userId ?? ""),
      createdAt: String(row.createdAt ?? ""),
    }),
    [],
  );
  const { q, setQ, status, setStatus, state, setState, error, rows, load } = useResourceList(
    "/api/admin/investments",
    "investments",
    mapRow,
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [plans, setPlans] = useState<
    Array<{
      planVersionId: string;
      planName: string;
      currency: string;
      minPrincipalMinor: string;
      maxPrincipalMinor: string;
      termDays: number;
    }>
  >([]);
  const [userId, setUserId] = useState("");
  const [planVersionId, setPlanVersionId] = useState("");
  const [amountUsd, setAmountUsd] = useState("");
  const [fundShortfall, setFundShortfall] = useState(true);
  const [createBusy, setCreateBusy] = useState(false);
  const [createFeedback, setCreateFeedback] = useState<string | null>(null);
  const router = useRouter();

  async function openCreate() {
    setCreateFeedback(null);
    setCreateOpen(true);
    const result = await getAdminJson<{
      plans: Array<{
        planVersionId: string;
        planName: string;
        currency: string;
        minPrincipalMinor: string;
        maxPrincipalMinor: string;
        termDays: number;
      }>;
    }>("/api/admin/investments?plans=1");
    if (result.error) {
      setCreateFeedback(result.error);
      return;
    }
    const nextPlans = result.data?.plans ?? [];
    setPlans(nextPlans);
    if (!planVersionId && nextPlans[0]) {
      setPlanVersionId(nextPlans[0].planVersionId);
    }
  }

  async function createInvestment() {
    const dollars = Number(amountUsd);
    if (!userId.trim() || !planVersionId || !Number.isFinite(dollars) || dollars <= 0) {
      setCreateFeedback("Enter a valid customer user ID, plan, and USD amount.");
      return;
    }
    const principalMinor = String(Math.round(dollars * 100));
    setCreateBusy(true);
    setCreateFeedback(null);
    const result = await mutateAdminJson<{ investment?: { id?: string } }>(
      "POST",
      "/api/admin/investments",
      {
        userId: userId.trim(),
        planVersionId,
        principalMinor,
        fundShortfall,
      },
    );
    setCreateBusy(false);
    if (result.error) {
      setCreateFeedback(result.error);
      return;
    }
    setCreateOpen(false);
    setAmountUsd("");
    const id = result.data?.investment?.id;
    if (id) {
      router.push(`/admin/investments/${id}`);
      return;
    }
    setState("loading");
    await load();
  }

  return (
    <div>
      <ResourceListPage
        title="Investments"
        description="Create and manage certified investments. New investments fund from available balance (or auto-credit shortfall when enabled)."
        searchLabel="Search investments"
        q={q}
        setQ={setQ}
        status={status}
        setStatus={setStatus}
        statusOptions={[
          { value: "active", label: "Active" },
          { value: "matured", label: "Matured" },
          { value: "pending", label: "Pending" },
          { value: "cancelled", label: "Cancelled" },
        ]}
        state={state}
        error={error}
        load={load}
        setState={setState}
        emptyTitle="No investments found"
        rows={rows}
        detailHref={(id) => `/admin/investments/${id}`}
        headerAction={
          <Button type="button" onClick={() => void openCreate()}>
            Add investment
          </Button>
        }
        columns={[
          { key: "id", header: "Investment", cell: (row) => row.id },
          {
            key: "status",
            header: "Status",
            cell: (row) => <Badge variant="secondary">{row.status}</Badge>,
          },
          {
            key: "principal",
            header: "Principal",
            cell: (row) => `$${(Number(row.amountMinor) / 100).toFixed(2)}`,
          },
          {
            key: "created",
            header: "Created",
            cell: (row) => (row.createdAt ? new Date(row.createdAt).toLocaleString() : "—"),
          },
        ]}
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add investment</DialogTitle>
            <DialogDescription>
              Activates a certified plan for a customer. When funding shortfall is enabled,
              available balance is topped up automatically before activation.
            </DialogDescription>
          </DialogHeader>
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">Customer user ID</span>
            <Input
              value={userId}
              onChange={(event) => setUserId(event.target.value.trim())}
              placeholder="UUID from customer detail page"
            />
          </label>
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">Plan</span>
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={planVersionId}
              onChange={(event) => setPlanVersionId(event.target.value)}
            >
              {plans.map((plan) => (
                <option key={plan.planVersionId} value={plan.planVersionId}>
                  {plan.planName} · {plan.termDays}d · {plan.currency}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">Principal (USD)</span>
            <Input
              value={amountUsd}
              onChange={(event) => setAmountUsd(event.target.value)}
              inputMode="decimal"
              placeholder="1000"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={fundShortfall}
              onChange={(event) => setFundShortfall(event.target.checked)}
            />
            Auto-credit wallet if balance is insufficient
          </label>
          {createFeedback ? (
            <Alert variant="destructive">
              <AlertDescription>{createFeedback}</AlertDescription>
            </Alert>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={createBusy} onClick={() => void createInvestment()}>
              {createBusy ? "Creating…" : "Create investment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ResourceListPage<
  TRow extends {
    id: string;
    reference?: string;
    status: string;
    amountMinor?: string;
    createdAt: string;
  },
>({
  title,
  description,
  searchLabel,
  q,
  setQ,
  status,
  setStatus,
  statusOptions,
  state,
  error,
  load,
  setState,
  emptyTitle,
  rows,
  columns,
  detailHref,
  headerAction,
}: {
  title: string;
  description: string;
  searchLabel: string;
  q: string;
  setQ: (value: string) => void;
  status: string;
  setStatus: (value: string) => void;
  statusOptions: Array<{ value: string; label: string }>;
  state: LoadState;
  error: { message: string; status?: number } | null;
  load: () => Promise<void>;
  setState: (value: LoadState) => void;
  emptyTitle: string;
  rows: TRow[];
  columns: Array<{ key: string; header: string; cell: (row: TRow) => React.ReactNode }>;
  detailHref: (id: string) => string;
  headerAction?: React.ReactNode;
}) {
  return (
    <div>
      <AdminPageHeader title={title} description={description} action={headerAction} />
      <AdminToolbar
        searchLabel={searchLabel}
        searchValue={q}
        onSearchChange={setQ}
        statusValue={status}
        statusOptions={statusOptions}
        onStatusChange={setStatus}
        trailing={
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setState("loading");
              void load();
            }}
          >
            Refresh
          </Button>
        }
      />
      {state === "loading" ? <AdminLoadingBlock /> : null}
      {state === "error" && error ? (
        <AdminErrorBlock
          message={error.message}
          {...(error.status ? { status: error.status } : {})}
          onRetry={() => {
            setState("loading");
            void load();
          }}
        />
      ) : null}
      {state === "ready" && rows.length === 0 ? <AdminEmptyBlock title={emptyTitle} /> : null}
      {state === "ready" && rows.length > 0 ? (
        <AdminDataTable
          caption={`${title} results`}
          columns={columns}
          rows={rows}
          rowActions={(row) => (
            <Button asChild size="sm" variant="ghost">
              <Link href={detailHref(row.id)}>Open</Link>
            </Button>
          )}
        />
      ) : null}
    </div>
  );
}

export function DepositDetailPanel() {
  return <FinancialDetailView kind="deposit" />;
}

export function WithdrawalDetailPanel() {
  return <FinancialDetailView kind="withdrawal" />;
}

export function InvestmentDetailPanel() {
  const params = useParams<{ investmentId: string }>();
  const investmentId = params.investmentId;
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState<{ message: string; status?: number } | null>(null);
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const load = useCallback(async () => {
    const result = await getAdminJson<Record<string, unknown>>(
      `/api/admin/investments/${investmentId}`,
    );
    if (result.error) {
      setError({ message: result.error, ...(result.status ? { status: result.status } : {}) });
      setState("error");
      return;
    }
    setDetail(result.data ?? null);
    setState("ready");
  }, [investmentId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function cancelInvestment() {
    setBusy(true);
    setFeedback(null);
    const result = await mutateAdminJson<{ investment?: { status?: string } }>(
      "PATCH",
      `/api/admin/investments/${investmentId}`,
      {
        status: "cancelled",
        reason: cancelReason.trim() || "Administrative cancellation",
      },
    );
    setBusy(false);
    if (result.error) {
      setFeedback(result.error);
      return;
    }
    setFeedback(
      "Investment cancelled and principal released to available balance when applicable.",
    );
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

  const investment = (detail?.investment ?? {}) as Record<string, unknown>;
  const status = String(investment.status ?? "");
  const canCancel = status === "active" || status === "pending" || status === "maturing";

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Investment detail"
        description="Review schedule and cancel active investments when needed."
        action={
          <Button asChild type="button" variant="outline">
            <Link href="/admin/investments">Back</Link>
          </Button>
        }
      />
      {feedback ? (
        <Alert>
          <AlertDescription>{feedback}</AlertDescription>
        </Alert>
      ) : null}
      <Card className="space-y-3 p-4">
        <div className="grid gap-2 sm:grid-cols-2">
          <p className="text-sm">
            <span className="text-muted-foreground">ID:</span> {String(investment.id ?? "")}
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">Status:</span> {status}
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">Customer:</span>{" "}
            {String(investment.userId ?? "")}
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">Principal:</span> $
            {(Number(investment.principalMinor ?? 0) / 100).toFixed(2)}
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">Posted ROI:</span> $
            {(Number(detail?.postedRoiMinor ?? 0) / 100).toFixed(2)}
          </p>
        </div>
        {canCancel ? (
          <div className="space-y-2 border-t pt-3">
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">Cancel reason</span>
              <Input
                value={cancelReason}
                onChange={(event) => setCancelReason(event.target.value)}
                placeholder="Optional reason"
              />
            </label>
            <Button
              type="button"
              variant="destructive"
              disabled={busy}
              onClick={() => void cancelInvestment()}
            >
              {busy ? "Cancelling…" : "Cancel investment"}
            </Button>
          </div>
        ) : null}
      </Card>
      <Card className="p-4">
        <pre className="overflow-x-auto text-xs">{JSON.stringify(detail, null, 2)}</pre>
      </Card>
    </div>
  );
}

function FinancialDetailView({ kind }: { kind: "deposit" | "withdrawal" }) {
  const params = useParams<{ depositId?: string; withdrawalId?: string }>();
  const id = kind === "deposit" ? params.depositId : params.withdrawalId;
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState<{ message: string; status?: number } | null>(null);
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<"approve" | "reject" | "complete" | null>(
    null,
  );

  const base = kind === "deposit" ? `/api/admin/deposits/${id}` : `/api/admin/withdrawals/${id}`;

  const load = useCallback(async () => {
    const result = await getAdminJson<Record<string, unknown>>(base);
    if (result.error) {
      setError({ message: result.error, ...(result.status ? { status: result.status } : {}) });
      setState("error");
      return;
    }
    setDetail(result.data ?? null);
    setState("ready");
  }, [base]);

  useEffect(() => {
    void load();
  }, [load]);

  async function runAction() {
    if (!confirmAction) return;
    setBusy(true);
    const path = confirmAction === "complete" ? `${base}/complete` : `${base}/${confirmAction}`;
    const result = await mutateAdminJson("POST", path, {
      reason: reason.trim() || "Administrative review",
    });
    setBusy(false);
    setConfirmAction(null);
    if (result.error) {
      setFeedback(result.error);
      return;
    }
    setFeedback(`${confirmAction} completed.`);
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

  return (
    <div>
      <AdminPageHeader
        title={kind === "deposit" ? "Deposit detail" : "Withdrawal detail"}
        description="Actions wrap certified financial engines. Reasons are required for review decisions."
      />
      {feedback ? (
        <p className="mb-4 rounded-md border bg-card px-3 py-2 text-sm" role="status">
          {feedback}
        </p>
      ) : null}
      <Card className="mb-4 space-y-3 p-4">
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">Review reason</span>
          <Input
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            aria-label="Review reason"
            placeholder="Required for approve / reject"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <Button type="button" disabled={busy} onClick={() => setConfirmAction("approve")}>
            Approve
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={busy}
            onClick={() => setConfirmAction("reject")}
          >
            Reject
          </Button>
          {kind === "withdrawal" ? (
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => setConfirmAction("complete")}
            >
              Mark completed
            </Button>
          ) : null}
        </div>
      </Card>
      <Card className="p-4">
        <pre className="overflow-x-auto text-xs">{JSON.stringify(detail, null, 2)}</pre>
      </Card>
      <Dialog
        open={confirmAction !== null}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm {confirmAction}</DialogTitle>
            <DialogDescription>
              This calls the certified {kind} engine. No ledger bypass is performed by the UI.
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
    </div>
  );
}
