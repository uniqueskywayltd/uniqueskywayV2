"use client";

/* Admin list/detail panels fetch certified admin APIs after mount.
   Loading state updates happen in async continuations equivalent to the customer shell pattern. */
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { Badge, Button, Card, Input, StatusChip, Textarea } from "@/components/ui";
import { DashboardPanelCard } from "@/components/ui/dashboard-panel-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { getAdminJson, mutateAdminJson } from "../api-client";
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
      email: string;
      status: string;
      kycStatus: string;
      createdAt: string;
    }>
  >([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const [createEmail, setCreateEmail] = useState("");
  const [createName, setCreateName] = useState("");
  const [createBusy, setCreateBusy] = useState(false);
  const [createFeedback, setCreateFeedback] = useState<string | null>(null);
  const router = useRouter();

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (status !== "all") params.set("status", status);
    params.set("limit", "50");
    const result = await getAdminJson<{
      customers: Array<{
        userId: string;
        email: string;
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
      (result.data?.customers ?? []).map((row) => ({
        id: row.userId,
        email: row.email,
        status: row.accountStatus ?? row.userStatus ?? "unknown",
        kycStatus: row.kycStatus ?? "unknown",
        createdAt: row.userCreatedAt,
      })),
    );
    setState("ready");
  }, [q, status]);

  useEffect(() => {
    void load();
  }, [load]);

  async function createCustomer() {
    if (!createEmail.trim()) return;
    setCreateBusy(true);
    setCreateFeedback(null);
    const result = await mutateAdminJson<{
      user?: { id?: string };
      temporaryPassword?: string;
    }>("POST", "/api/admin/users", {
      email: createEmail.trim(),
      displayName: createName.trim() || undefined,
    });
    setCreateBusy(false);
    if (result.error) {
      setCreateFeedback(result.error);
      return;
    }
    setCreateOpen(false);
    setCreateEmail("");
    setCreateName("");
    const temp = result.data?.temporaryPassword;
    setCreateFeedback(
      temp
        ? `Customer created. Temporary password: ${temp}`
        : "Customer created and welcome email queued.",
    );
    const id = result.data?.user?.id;
    if (id) {
      router.push(`/admin/customers/${id}`);
      return;
    }
    await load();
  }

  return (
    <div>
      <AdminPageHeader
        title="Customers"
        description="Search, filter, and open customer administration records."
        action={
          <Button type="button" onClick={() => setCreateOpen(true)}>
            Create customer
          </Button>
        }
      />
      {createFeedback ? (
        <p className="mb-4 rounded-md border bg-card px-3 py-2 text-sm" role="status">
          {createFeedback}
        </p>
      ) : null}
      <AdminToolbar
        searchLabel="Search customers"
        searchValue={q}
        onSearchChange={setQ}
        statusLabel="Account status"
        statusValue={status}
        statusOptions={[
          { value: "active", label: "Active" },
          { value: "suspended", label: "Suspended" },
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
            { key: "email", header: "Email", cell: (row) => row.email },
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create customer</DialogTitle>
            <DialogDescription>
              Creates an active, email-verified account with wallet bootstrap and sends a welcome
              email with a temporary password. OTP verification is not required.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={createEmail}
            onChange={(event) => setCreateEmail(event.target.value)}
            aria-label="Customer email"
            placeholder="customer@example.com"
          />
          <Input
            value={createName}
            onChange={(event) => setCreateName(event.target.value)}
            aria-label="Display name"
            placeholder="Display name (optional)"
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={createBusy || !createEmail.trim()}
              onClick={() => void createCustomer()}
            >
              {createBusy ? "Creating…" : "Create"}
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
              This closes the account and removes auth access. Type DELETE to confirm. You cannot
              delete your own administrator account.
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
                  "Customer deleted.",
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
      createdAt: String(row.createdAt ?? ""),
    }),
    [],
  );
  const { q, setQ, status, setStatus, state, setState, error, rows, load } = useResourceList(
    "/api/admin/investments",
    "investments",
    mapRow,
  );

  return (
    <ResourceListPage
      title="Investments"
      description="Read-only investment viewer over the certified investment engine."
      searchLabel="Search investments"
      q={q}
      setQ={setQ}
      status={status}
      setStatus={setStatus}
      statusOptions={[
        { value: "active", label: "Active" },
        { value: "matured", label: "Matured" },
        { value: "pending", label: "Pending" },
      ]}
      state={state}
      error={error}
      load={load}
      setState={setState}
      emptyTitle="No investments found"
      rows={rows}
      detailHref={(id) => `/admin/investments/${id}`}
      columns={[
        { key: "id", header: "Investment", cell: (row) => row.id },
        {
          key: "status",
          header: "Status",
          cell: (row) => <Badge variant="secondary">{row.status}</Badge>,
        },
        { key: "principal", header: "Principal (minor)", cell: (row) => row.amountMinor },
        {
          key: "created",
          header: "Created",
          cell: (row) => (row.createdAt ? new Date(row.createdAt).toLocaleString() : "—"),
        },
      ]}
    />
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
}) {
  return (
    <div>
      <AdminPageHeader title={title} description={description} />
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
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState<{ message: string; status?: number } | null>(null);
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);

  const load = useCallback(async () => {
    const result = await getAdminJson<Record<string, unknown>>(
      `/api/admin/investments/${params.investmentId}`,
    );
    if (result.error) {
      setError({ message: result.error, ...(result.status ? { status: result.status } : {}) });
      setState("error");
      return;
    }
    setDetail(result.data ?? null);
    setState("ready");
  }, [params.investmentId]);

  useEffect(() => {
    void load();
  }, [load]);

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
      <AdminPageHeader title="Investment detail" description="Read-only investment viewer." />
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
  const [confirmAction, setConfirmAction] = useState<"approve" | "reject" | "queue" | null>(null);

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
    const path = confirmAction === "queue" ? `${base}/queue` : `${base}/${confirmAction}`;
    const result = await mutateAdminJson(
      "POST",
      path,
      confirmAction === "queue" ? {} : { reason: reason.trim() || "Administrative review" },
    );
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
              onClick={() => setConfirmAction("queue")}
            >
              Queue payout
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
