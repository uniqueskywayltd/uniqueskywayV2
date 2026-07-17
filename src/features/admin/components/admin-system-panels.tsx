"use client";

/* Admin system panels fetch certified admin APIs after mount.
   Loading state updates happen in async continuations equivalent to the customer shell pattern. */
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";

import { Badge, Button, Card, Textarea } from "@/components/ui";
import { appPath } from "@/lib/app-path";
import { cn } from "@/lib/utils";

import { getAdminJson, mutateAdminJson } from "../api-client";
import { formatUsdFromMinor, humanizeStatus } from "../lib/presentation";
import { AdminDataTable, AdminMetricGrid, AdminToolbar } from "./admin-data-table";
import { AdminPlainRecord } from "./admin-info";
import {
  AdminEmptyBlock,
  AdminErrorBlock,
  AdminLoadingBlock,
  AdminPageHeader,
} from "./admin-states";

type LoadState = "loading" | "ready" | "error";

export function SettlementsPanel() {
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState<{ message: string; status?: number } | null>(null);
  const [rows, setRows] = useState<
    Array<{ id: string; status: string; settlementDate: string; runType: string }>
  >([]);

  const load = useCallback(async () => {
    const result = await getAdminJson<{
      runs: Array<{
        id: string;
        status: string;
        settlementDate: string;
        runType: string;
      }>;
    }>("/api/admin/settlements/runs?limit=50");
    if (result.error) {
      setError({ message: result.error, ...(result.status ? { status: result.status } : {}) });
      setState("error");
      return;
    }
    setRows(result.data?.runs ?? []);
    setState("ready");
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <AdminPageHeader
        title="Settlements"
        description="Read-only settlement run viewer over certified settlement data."
        action={
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
        <AdminEmptyBlock title="No settlement runs" />
      ) : null}
      {state === "ready" && rows.length > 0 ? (
        <AdminDataTable
          caption="Settlement runs"
          rows={rows}
          columns={[
            { key: "date", header: "Settlement date", cell: (row) => row.settlementDate },
            { key: "type", header: "Type", cell: (row) => row.runType },
            {
              key: "status",
              header: "Status",
              cell: (row) => <Badge variant="secondary">{row.status}</Badge>,
            },
          ]}
          rowActions={(row) => (
            <Button asChild size="sm" variant="ghost">
              <Link href={`/admin/settlements/${row.id}`}>Open</Link>
            </Button>
          )}
        />
      ) : null}
    </div>
  );
}

export function SettlementDetailPanel({ runId }: { runId: string }) {
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState<{ message: string; status?: number } | null>(null);
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);

  const load = useCallback(async () => {
    const result = await getAdminJson<Record<string, unknown>>(
      `/api/admin/settlements/runs/${runId}`,
    );
    if (result.error) {
      setError({ message: result.error, ...(result.status ? { status: result.status } : {}) });
      setState("error");
      return;
    }
    setDetail(result.data ?? null);
    setState("ready");
  }, [runId]);

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
    <div className="space-y-4">
      <AdminPageHeader
        title="Settlement run"
        description="Details for this settlement batch."
        action={
          <Button asChild type="button" variant="outline">
            <Link href="/admin/settlements">Back to Settlements</Link>
          </Button>
        }
      />
      <AdminPlainRecord
        title="Settlement Summary"
        record={(detail?.run as Record<string, unknown> | undefined) ?? detail}
        preferKeys={["status", "settlementDate", "runType", "createdAt", "updatedAt"]}
      />
    </div>
  );
}

export function StaffPanel() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState<{ message: string; status?: number } | null>(null);
  const [rows, setRows] = useState<
    Array<{ id: string; email: string; status: string; createdAt: string }>
  >([]);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (status !== "all") params.set("status", status);
    const result = await getAdminJson<{
      staff: Array<{
        user: { id: string; email: string };
        adminProfile: { status: string; createdAt: string };
      }>;
    }>(`/api/admin/staff?${params.toString()}`);
    if (result.error) {
      setError({ message: result.error, ...(result.status ? { status: result.status } : {}) });
      setState("error");
      return;
    }
    setRows(
      (result.data?.staff ?? []).map((row) => ({
        id: row.user.id,
        email: row.user.email,
        status: row.adminProfile.status,
        createdAt: row.adminProfile.createdAt,
      })),
    );
    setState("ready");
  }, [q, status]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <AdminPageHeader title="Staff" description="Staff accounts and administrative access." />
      <AdminToolbar
        searchLabel="Search staff"
        searchValue={q}
        onSearchChange={setQ}
        statusValue={status}
        statusOptions={[
          { value: "active", label: "Active" },
          { value: "suspended", label: "Suspended" },
          { value: "deactivated", label: "Deactivated" },
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
      {state === "ready" && rows.length === 0 ? <AdminEmptyBlock title="No staff found" /> : null}
      {state === "ready" && rows.length > 0 ? (
        <AdminDataTable
          caption="Staff accounts"
          rows={rows}
          columns={[
            { key: "email", header: "Email", cell: (row) => row.email },
            {
              key: "status",
              header: "Status",
              cell: (row) => <Badge variant="secondary">{row.status}</Badge>,
            },
            {
              key: "created",
              header: "Created",
              cell: (row) => new Date(row.createdAt).toLocaleDateString(),
            },
          ]}
          rowActions={(row) => (
            <Button asChild size="sm" variant="ghost">
              <Link href={`/admin/staff/${row.id}`}>Open</Link>
            </Button>
          )}
        />
      ) : null}
    </div>
  );
}

export function StaffDetailPanel({ userId }: { userId: string }) {
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState<{ message: string; status?: number } | null>(null);
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);

  const load = useCallback(async () => {
    const result = await getAdminJson<{ staff: Record<string, unknown> }>(
      `/api/admin/staff/${userId}`,
    );
    if (result.error) {
      setError({ message: result.error, ...(result.status ? { status: result.status } : {}) });
      setState("error");
      return;
    }
    setDetail(result.data?.staff ?? null);
    setState("ready");
  }, [userId]);

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
    <div className="space-y-4">
      <AdminPageHeader
        title="Staff member"
        description="Roles, sessions, and recent sign-in activity."
        action={
          <Button asChild type="button" variant="outline">
            <Link href="/admin/staff">Back to Staff</Link>
          </Button>
        }
      />
      <AdminPlainRecord
        title="Account"
        record={
          (detail?.user as Record<string, unknown> | undefined) ??
          (detail as Record<string, unknown> | null)
        }
        preferKeys={["email", "status", "createdAt", "updatedAt"]}
      />
      <AdminPlainRecord
        title="Profile"
        record={detail?.adminProfile as Record<string, unknown> | undefined}
        preferKeys={["status", "createdAt", "updatedAt"]}
      />
    </div>
  );
}

export function RolesPanel() {
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState<{ message: string; status?: number } | null>(null);
  const [rows, setRows] = useState<
    Array<{ id: string; key: string; name: string; status: string; isSystem: boolean }>
  >([]);

  const load = useCallback(async () => {
    const result = await getAdminJson<{
      roles: Array<{
        id: string;
        key: string;
        name: string;
        status: string;
        isSystem: boolean;
      }>;
    }>("/api/admin/roles");
    if (result.error) {
      setError({ message: result.error, ...(result.status ? { status: result.status } : {}) });
      setState("error");
      return;
    }
    setRows(result.data?.roles ?? []);
    setState("ready");
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <AdminPageHeader
        title="Roles"
        description="Configurable roles and permission grants from the admin RBAC catalog."
        action={
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
      {state === "ready" && rows.length === 0 ? <AdminEmptyBlock title="No roles found" /> : null}
      {state === "ready" && rows.length > 0 ? (
        <AdminDataTable
          caption="Roles"
          rows={rows}
          columns={[
            { key: "name", header: "Name", cell: (row) => row.name },
            { key: "key", header: "Key", cell: (row) => row.key },
            {
              key: "system",
              header: "System",
              cell: (row) => (row.isSystem ? "Yes" : "No"),
            },
            {
              key: "status",
              header: "Status",
              cell: (row) => <Badge variant="secondary">{row.status}</Badge>,
            },
          ]}
        />
      ) : null}
    </div>
  );
}

export function ReportsPanel() {
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState<{ message: string; status?: number } | null>(null);
  const [dashboard, setDashboard] = useState<Record<string, unknown> | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const load = useCallback(async () => {
    const result = await getAdminJson<{ dashboard: Record<string, unknown> }>(
      "/api/admin/reports/executive",
    );
    if (result.error) {
      setError({ message: result.error, ...(result.status ? { status: result.status } : {}) });
      setState("error");
      return;
    }
    setDashboard(result.data?.dashboard ?? null);
    setState("ready");
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function exportReport(format: "csv" | "xlsx") {
    setBusy(true);
    setFeedback(null);
    try {
      const csrfResponse = await fetch(appPath("/api/auth/csrf"), { credentials: "include" });
      const csrfPayload = (await csrfResponse.json()) as { data?: { csrfToken?: string } };
      const response = await fetch(appPath("/api/admin/reports/export"), {
        method: "POST",
        credentials: "include",
        headers: {
          "content-type": "application/json",
          "x-csrf-token": csrfPayload.data?.csrfToken ?? "",
        },
        body: JSON.stringify({ reportKey: "executive.dashboard", format }),
      });
      if (!response.ok) {
        setFeedback("Export failed.");
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `executive-dashboard.${format === "csv" ? "csv" : "xlsx"}`;
      anchor.click();
      URL.revokeObjectURL(url);
      setFeedback(`Exported executive dashboard as ${format.toUpperCase()}.`);
    } catch {
      setFeedback("Export unavailable while offline.");
    } finally {
      setBusy(false);
    }
  }

  const customers =
    (dashboard?.customers as
      { total?: number; verified?: number; suspended?: number } | undefined) ?? {};
  const money =
    (dashboard?.moneyMovement as
      | {
          pendingDeposits?: number;
          pendingWithdrawals?: number;
          totalRoiPaidMinor?: string;
        }
      | undefined) ?? {};

  return (
    <div>
      <AdminPageHeader
        title="Reports"
        description="Business summary and downloadable exports."
        action={
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => void exportReport("csv")}
            >
              Export CSV
            </Button>
            <Button type="button" disabled={busy} onClick={() => void exportReport("xlsx")}>
              Export Excel
            </Button>
          </div>
        }
      />
      {feedback ? (
        <p className="mb-4 rounded-md border bg-card px-3 py-2 text-sm" role="status">
          {feedback}
        </p>
      ) : null}
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
        <AdminMetricGrid
          metrics={[
            { label: "Total customers", value: customers.total ?? 0 },
            { label: "Verified customers", value: customers.verified ?? 0 },
            { label: "Suspended customers", value: customers.suspended ?? 0 },
            { label: "Pending deposits", value: money.pendingDeposits ?? 0 },
            { label: "Pending withdrawals", value: money.pendingWithdrawals ?? 0 },
            { label: "ROI paid", value: formatUsdFromMinor(money.totalRoiPaidMinor ?? "0") },
          ]}
        />
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          ["customers", "Customer reports"],
          ["financial", "Financial reports"],
          ["operational", "Operational reports"],
          ["system", "System reports"],
        ].map(([kind, label]) => (
          <Card key={kind} className="p-4">
            <h2 className="text-sm font-semibold">{label}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Available via `/api/admin/reports/{kind}` with filters and exports.
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function JobsPanel() {
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState<{ message: string; status?: number } | null>(null);
  const [rows, setRows] = useState<
    Array<{ id: string; jobType: string; status: string; createdAt: string }>
  >([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const result = await getAdminJson<{
      rows: Array<{ id: string; jobType: string; status: string; createdAt: string }>;
    }>("/api/admin/jobs?limit=50");
    if (result.error) {
      // listJobs returns { rows, nextCursor } directly from service as jsonOk(jobs)
      const alt = await getAdminJson<
        {
          rows?: Array<{ id: string; jobType: string; status: string; createdAt: string }>;
        } & Record<string, unknown>
      >("/api/admin/jobs");
      if (alt.error) {
        setError({ message: alt.error, ...(alt.status ? { status: alt.status } : {}) });
        setState("error");
        return;
      }
      setRows(alt.data?.rows ?? []);
      setState("ready");
      return;
    }
    setRows(result.data?.rows ?? []);
    setState("ready");
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function retry(jobId: string) {
    setBusyId(jobId);
    await mutateAdminJson("POST", `/api/admin/jobs/${jobId}/retry`);
    setBusyId(null);
    await load();
  }

  return (
    <div>
      <AdminPageHeader title="Background jobs" description="Monitor, retry, and cancel jobs." />
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
      {state === "ready" && rows.length === 0 ? <AdminEmptyBlock title="No jobs found" /> : null}
      {state === "ready" && rows.length > 0 ? (
        <AdminDataTable
          caption="Background jobs"
          rows={rows}
          columns={[
            { key: "type", header: "Type", cell: (row) => row.jobType },
            {
              key: "status",
              header: "Status",
              cell: (row) => <Badge variant="secondary">{row.status}</Badge>,
            },
            {
              key: "created",
              header: "Created",
              cell: (row) => new Date(row.createdAt).toLocaleString(),
            },
          ]}
          rowActions={(row) => (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busyId === row.id}
              onClick={() => void retry(row.id)}
            >
              Retry
            </Button>
          )}
        />
      ) : null}
    </div>
  );
}

export function SecurityPanel() {
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState<{ message: string; status?: number } | null>(null);
  const [payload, setPayload] = useState<Record<string, unknown> | null>(null);

  const load = useCallback(async () => {
    const result = await getAdminJson<Record<string, unknown>>("/api/admin/security/center");
    if (result.error) {
      setError({ message: result.error, ...(result.status ? { status: result.status } : {}) });
      setState("error");
      return;
    }
    setPayload(result.data ?? null);
    setState("ready");
  }, []);

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
    <div className="space-y-4">
      <AdminPageHeader
        title="Security center"
        description="Recent security events and administrative activity."
      />
      <AdminPlainRecord
        title="Overview"
        record={payload}
        preferKeys={["status", "openIncidents", "failedLogins24h", "updatedAt"]}
      />
    </div>
  );
}

export function FeatureFlagsPanel() {
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState<{ message: string; status?: number } | null>(null);
  const [rows, setRows] = useState<
    Array<{ id: string; key: string; status: string; description: string | null }>
  >([]);

  const load = useCallback(async () => {
    const result = await getAdminJson<{
      featureFlags: Array<{
        key: string;
        status: string;
        description: string | null;
      }>;
    }>("/api/admin/feature-flags");
    if (result.error) {
      setError({ message: result.error, ...(result.status ? { status: result.status } : {}) });
      setState("error");
      return;
    }
    setRows(
      (result.data?.featureFlags ?? []).map((flag) => ({
        id: flag.key,
        key: flag.key,
        status: flag.status,
        description: flag.description,
      })),
    );
    setState("ready");
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <AdminPageHeader title="Feature flags" description="Runtime feature flag configuration." />
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
      {state === "ready" && rows.length === 0 ? <AdminEmptyBlock title="No feature flags" /> : null}
      {state === "ready" && rows.length > 0 ? (
        <AdminDataTable
          caption="Feature flags"
          rows={rows}
          columns={[
            { key: "key", header: "Key", cell: (row) => row.key },
            {
              key: "status",
              header: "Status",
              cell: (row) => <Badge variant="secondary">{row.status}</Badge>,
            },
            {
              key: "description",
              header: "Description",
              cell: (row) => row.description ?? "—",
            },
          ]}
        />
      ) : null}
    </div>
  );
}

export function SettingsPanel() {
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState<{ message: string; status?: number } | null>(null);
  const [rows, setRows] = useState<
    Array<{ id: string; key: string; value: string; description: string | null }>
  >([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const load = useCallback(async () => {
    const result = await getAdminJson<{
      settings: Array<{ key: string; value: unknown; description: string | null }>;
    }>("/api/admin/settings");
    if (result.error) {
      setError({ message: result.error, ...(result.status ? { status: result.status } : {}) });
      setState("error");
      return;
    }
    const nextRows = (result.data?.settings ?? []).map((setting) => ({
      id: setting.key,
      key: setting.key,
      value:
        typeof setting.value === "string" ||
        typeof setting.value === "number" ||
        typeof setting.value === "boolean"
          ? String(setting.value)
          : formatPlainObject(setting.value),
      description: setting.description,
    }));
    setRows(nextRows);
    setDrafts(Object.fromEntries(nextRows.map((row) => [row.key, row.value])));
    setState("ready");
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveSetting(key: string) {
    const raw = drafts[key] ?? "";
    let value: string | number | boolean | Record<string, unknown> = raw;
    try {
      value = JSON.parse(raw) as string | number | boolean | Record<string, unknown>;
    } catch {
      value = raw;
    }
    setBusyKey(key);
    setFeedback(null);
    const result = await mutateAdminJson("POST", "/api/admin/settings", { key, value });
    setBusyKey(null);
    if (result.error) {
      setFeedback(result.error);
      return;
    }
    setFeedback(`Saved ${key}`);
    await load();
  }

  return (
    <div>
      <AdminPageHeader
        title="Platform settings"
        description="Edit platform options. Changes save immediately."
      />
      {feedback ? (
        <p className="mb-4 rounded-md border bg-card px-3 py-2 text-sm" role="status">
          {feedback}
        </p>
      ) : null}
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
      {state === "ready" && rows.length === 0 ? <AdminEmptyBlock title="No settings" /> : null}
      {state === "ready" && rows.length > 0 ? (
        <div className="space-y-4">
          {rows.map((row) => (
            <Card key={row.key} className="space-y-3 p-4">
              <div>
                <p className="text-sm font-semibold">{row.key}</p>
                <p className="text-xs text-muted-foreground">{row.description ?? "—"}</p>
              </div>
              <Textarea
                value={drafts[row.key] ?? ""}
                onChange={(event) =>
                  setDrafts((current) => ({ ...current, [row.key]: event.target.value }))
                }
                aria-label={`Setting ${row.key}`}
                rows={2}
              />
              <Button
                type="button"
                disabled={busyKey === row.key}
                onClick={() => void saveSetting(row.key)}
              >
                {busyKey === row.key ? "Saving…" : "Save"}
              </Button>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function SystemPanel() {
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState<{ message: string; status?: number } | null>(null);
  const [health, setHealth] = useState<SystemHealthSnapshot | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (opts?.silent) setRefreshing(true);
    const result = await getAdminJson<{ health: SystemHealthSnapshot }>("/api/admin/system/health");
    if (result.error) {
      setError({ message: result.error, ...(result.status ? { status: result.status } : {}) });
      if (!opts?.silent) setState("error");
      setRefreshing(false);
      return;
    }
    setHealth(result.data?.health ?? null);
    setError(null);
    setState("ready");
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const id = window.setInterval(() => {
      void load({ silent: true });
    }, 30_000);
    return () => window.clearInterval(id);
  }, [load]);

  if (state === "loading") return <AdminLoadingBlock />;
  if (state === "error" && error && !health) {
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

  if (!health) {
    return (
      <AdminEmptyBlock
        title="System health unavailable"
        description="No health snapshot was returned. Try refreshing."
      />
    );
  }

  const overall = deriveOverallStatus(health);
  const queueHealthy =
    health.queues.pendingJobs === 0 &&
    health.queues.runningJobs === 0 &&
    health.queues.failedJobs === 0;
  const webhookHealthy =
    health.webhooks.failedProviderEvents === 0 && health.webhooks.deadLetteredProviderEvents === 0;
  const report = buildDiagnosticReport(health);
  const shortCommit =
    health.gitCommit && health.gitCommit !== "unknown" ? health.gitCommit.slice(0, 7) : "—";

  async function copyReport() {
    try {
      await navigator.clipboard.writeText(report);
      setCopyFeedback("Diagnostic report copied.");
    } catch {
      setCopyFeedback("Unable to copy report.");
    }
    window.setTimeout(() => setCopyFeedback(null), 2500);
  }

  function downloadReport() {
    const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `system-health-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="System Health"
        description="Monitor the health and status of the Unique Sky Way platform."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={refreshing}
              onClick={() => void load({ silent: true })}
            >
              {refreshing ? "Refreshing…" : "Refresh"}
            </Button>
            <Button type="button" variant="outline" onClick={() => void copyReport()}>
              Copy Diagnostic Report
            </Button>
            <Button type="button" variant="outline" onClick={downloadReport}>
              Download Diagnostic Report
            </Button>
          </div>
        }
      />

      {copyFeedback ? (
        <p className="text-sm text-muted-foreground" role="status">
          {copyFeedback}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <HealthCard title="System Status" tone={overall.tone}>
          <p className="text-2xl font-semibold tracking-tight">
            {overall.emoji} {overall.label}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Auto-refreshes every 30 seconds</p>
        </HealthCard>

        <HealthCard title="Application" tone={statusToneFromOk(health.application === "ok")}>
          <HealthRow label="Application" value="Unique Sky Way" />
          <HealthRow
            label="Status"
            value={health.application === "ok" ? "Operational" : humanizeStatus(health.application)}
          />
          <HealthRow label="Version" value={health.version || "—"} />
          <HealthRow label="Release" value={health.releaseTag || "—"} />
          <HealthRow label="Commit" value={shortCommit} mono />
        </HealthCard>

        <HealthCard title="Database" tone={statusToneFromOk(health.database === "ok")}>
          <p className="text-xl font-semibold tracking-tight">
            {health.database === "ok" ? "🟢 Connected" : "🔴 Unavailable"}
          </p>
        </HealthCard>

        <HealthCard title="Queue Health" tone={queueHealthy ? "success" : "danger"}>
          <HealthRow label="Pending Jobs" value={String(health.queues.pendingJobs)} />
          <HealthRow label="Running Jobs" value={String(health.queues.runningJobs)} />
          <HealthRow label="Failed Jobs" value={String(health.queues.failedJobs)} />
        </HealthCard>

        <HealthCard title="Webhook Health" tone={webhookHealthy ? "success" : "warning"}>
          <HealthRow label="Failed Events" value={String(health.webhooks.failedProviderEvents)} />
          <HealthRow
            label="Dead Letter Queue"
            value={String(health.webhooks.deadLetteredProviderEvents)}
          />
        </HealthCard>

        <HealthCard title="Server" tone={cpuLoadTone(health.loadAverage[0] ?? 0)}>
          <HealthRow label="Server Uptime" value={formatUptime(health.uptimeSeconds)} />
          <p className="pt-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Memory Usage
          </p>
          <HealthRow label="RSS" value={formatBytesAsMb(health.memory.rss)} />
          <HealthRow label="Heap Used" value={formatBytesAsMb(health.memory.heapUsed)} />
          <HealthRow label="Heap Total" value={formatBytesAsMb(health.memory.heapTotal)} />
          <HealthRow label="CPU Load" value={formatCpuLoad(health.loadAverage[0] ?? 0)} />
        </HealthCard>
      </div>
    </div>
  );
}

type HealthTone = "success" | "warning" | "danger" | "neutral";

type SystemHealthSnapshot = {
  application: string;
  version: string;
  gitCommit: string;
  releaseTag: string;
  database: string;
  queues: {
    pendingJobs: number;
    failedJobs: number;
    runningJobs: number;
  };
  webhooks: {
    failedProviderEvents: number;
    deadLetteredProviderEvents: number;
  };
  memory: {
    rss: number;
    heapUsed: number;
    heapTotal: number;
    external?: number;
    arrayBuffers?: number;
  };
  loadAverage: number[];
  uptimeSeconds: number;
};

function HealthCard({
  title,
  tone,
  children,
}: {
  title: string;
  tone: HealthTone;
  children: ReactNode;
}) {
  return (
    <Card
      className={cn(
        "space-y-3 border p-5 shadow-sm",
        tone === "success" && "border-emerald-500/30 bg-emerald-500/5",
        tone === "warning" && "border-amber-500/30 bg-amber-500/5",
        tone === "danger" && "border-destructive/30 bg-destructive/5",
        tone === "neutral" && "border-border/70 bg-card",
      )}
    >
      <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </h2>
      <div className="space-y-2">{children}</div>
    </Card>
  );
}

function HealthRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("text-right font-medium text-foreground", mono && "font-mono text-xs")}>
        {value}
      </span>
    </div>
  );
}

function statusToneFromOk(ok: boolean): HealthTone {
  return ok ? "success" : "danger";
}

function deriveOverallStatus(health: SystemHealthSnapshot): {
  label: string;
  emoji: string;
  tone: HealthTone;
} {
  const critical =
    health.application !== "ok" || health.database !== "ok" || health.queues.failedJobs > 0;
  const warning =
    health.webhooks.failedProviderEvents > 0 ||
    health.webhooks.deadLetteredProviderEvents > 0 ||
    health.queues.pendingJobs > 25 ||
    health.queues.runningJobs > 10;

  if (critical) return { label: "Critical", emoji: "🔴", tone: "danger" };
  if (warning) return { label: "Warning", emoji: "🟡", tone: "warning" };
  return { label: "Operational", emoji: "🟢", tone: "success" };
}

function formatUptime(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  const secs = seconds % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days} day${days === 1 ? "" : "s"}`);
  if (hours > 0) parts.push(`${hours} hour${hours === 1 ? "" : "s"}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes === 1 ? "" : "s"}`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs} second${secs === 1 ? "" : "s"}`);
  return parts.join(" ");
}

function formatBytesAsMb(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

function formatCpuLoad(load: number): string {
  if (load < 1) return "Normal";
  if (load < 2) return "Elevated";
  return "High";
}

function cpuLoadTone(load: number): HealthTone {
  if (load < 1) return "success";
  if (load < 2) return "warning";
  return "danger";
}

function buildDiagnosticReport(health: SystemHealthSnapshot): string {
  const overall = deriveOverallStatus(health);
  const queueHealthy =
    health.queues.pendingJobs === 0 &&
    health.queues.runningJobs === 0 &&
    health.queues.failedJobs === 0;
  const shortCommit =
    health.gitCommit && health.gitCommit !== "unknown" ? health.gitCommit.slice(0, 7) : "—";

  return [
    "System Status",
    overall.label,
    "",
    "Application",
    "Unique Sky Way",
    "",
    "Status",
    health.application === "ok" ? "Operational" : humanizeStatus(health.application),
    "",
    "Version",
    health.version || "—",
    "",
    "Release",
    health.releaseTag || "—",
    "",
    "Commit",
    shortCommit,
    "",
    "Database",
    health.database === "ok" ? "Healthy" : humanizeStatus(health.database),
    "",
    "Queue",
    queueHealthy ? "Healthy" : "Attention needed",
    `Pending Jobs: ${health.queues.pendingJobs}`,
    `Running Jobs: ${health.queues.runningJobs}`,
    `Failed Jobs: ${health.queues.failedJobs}`,
    "",
    "Webhooks",
    `Failed Events: ${health.webhooks.failedProviderEvents}`,
    `Dead Letter Queue: ${health.webhooks.deadLetteredProviderEvents}`,
    "",
    "Memory",
    `${formatBytesAsMb(health.memory.heapUsed)} Heap Used`,
    `RSS ${formatBytesAsMb(health.memory.rss)}`,
    `Heap Total ${formatBytesAsMb(health.memory.heapTotal)}`,
    "",
    "CPU Load",
    formatCpuLoad(health.loadAverage[0] ?? 0),
    "",
    "Uptime",
    formatUptime(health.uptimeSeconds),
  ].join("\n");
}

export function AuditLogsPanel() {
  const [action, setAction] = useState("");
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState<{ message: string; status?: number } | null>(null);
  const [rows, setRows] = useState<
    Array<{
      id: string;
      action: string;
      actorType: string;
      actorUserId: string | null;
      targetType: string | null;
      targetId: string | null;
      createdAt: string;
    }>
  >([]);

  const load = useCallback(async () => {
    const params = new URLSearchParams({ limit: "100" });
    if (action.trim()) params.set("action", action.trim());
    const result = await getAdminJson<{
      auditLogs: Array<{
        id: string;
        action: string;
        actorType: string;
        actorUserId: string | null;
        targetType: string | null;
        targetId: string | null;
        createdAt: string;
      }>;
    }>(`/api/admin/audit-logs?${params}`);
    if (result.error) {
      setError({ message: result.error, ...(result.status ? { status: result.status } : {}) });
      setState("error");
      return;
    }
    setRows(result.data?.auditLogs ?? []);
    setState("ready");
  }, [action]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <AdminPageHeader
        title="Audit logs"
        description="Certified admin and system audit trail."
        action={
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
      <AdminToolbar searchLabel="Action" searchValue={action} onSearchChange={setAction} />
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
      {state === "ready" && rows.length === 0 ? <AdminEmptyBlock title="No audit logs" /> : null}
      {state === "ready" && rows.length > 0 ? (
        <AdminDataTable
          caption="Audit logs"
          rows={rows}
          columns={[
            {
              key: "createdAt",
              header: "When",
              cell: (row) => new Date(row.createdAt).toLocaleString(),
            },
            { key: "action", header: "Action", cell: (row) => row.action },
            { key: "actor", header: "Actor", cell: (row) => row.actorType },
            {
              key: "target",
              header: "Target",
              cell: (row) => (row.targetType ? `${row.targetType}:${row.targetId ?? "—"}` : "—"),
            },
          ]}
        />
      ) : null}
    </div>
  );
}

export function EmailTemplatesPanel() {
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState<{ message: string; status?: number } | null>(null);
  const [rows, setRows] = useState<
    Array<{ id: string; key: string; status: string; currentVersion: string; updatedAt?: string }>
  >([]);

  const load = useCallback(async () => {
    const result = await getAdminJson<{
      templates: Array<{ key: string; status: string; currentVersion: string; updatedAt?: string }>;
    }>("/api/admin/email-templates");
    if (result.error) {
      setError({ message: result.error, ...(result.status ? { status: result.status } : {}) });
      setState("error");
      return;
    }
    setRows(
      (result.data?.templates ?? []).map((template) => ({
        id: template.key,
        ...template,
      })),
    );
    setState("ready");
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <AdminPageHeader
        title="Notifications"
        description="Email messages sent to customers and administrators."
        action={
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
        <AdminEmptyBlock title="No notification templates" />
      ) : null}
      {state === "ready" && rows.length > 0 ? (
        <AdminDataTable
          caption="Email templates"
          rows={rows}
          columns={[
            { key: "key", header: "Template", cell: (row) => row.key },
            {
              key: "status",
              header: "Current Status",
              cell: (row) => <Badge variant="secondary">{humanizeStatus(row.status)}</Badge>,
            },
            { key: "version", header: "Version", cell: (row) => row.currentVersion },
          ]}
        />
      ) : null}
    </div>
  );
}

function formatPlainObject(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value !== "object") return String(value);
  if (Array.isArray(value)) {
    return value.map((item) => formatPlainObject(item)).join(", ");
  }
  return Object.entries(value as Record<string, unknown>)
    .map(([key, entry]) => `${key}: ${formatPlainObject(entry)}`)
    .join("; ");
}
