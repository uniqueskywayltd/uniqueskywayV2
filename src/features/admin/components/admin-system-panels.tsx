"use client";

/* Admin system panels fetch certified admin APIs after mount.
   Loading state updates happen in async continuations equivalent to the customer shell pattern. */
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { Badge, Button, Card, Textarea } from "@/components/ui";
import { appPath } from "@/lib/app-path";

import { getAdminJson, mutateAdminJson } from "../api-client";
import { AdminDataTable, AdminMetricGrid, AdminToolbar } from "./admin-data-table";
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
    <div>
      <AdminPageHeader title="Settlement run" description="Read-only settlement details." />
      <Card className="p-4">
        <pre className="overflow-x-auto text-xs">{JSON.stringify(detail, null, 2)}</pre>
      </Card>
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
    <div>
      <AdminPageHeader title="Staff detail" description="Roles, sessions, and login history." />
      <Card className="p-4">
        <pre className="overflow-x-auto text-xs">{JSON.stringify(detail, null, 2)}</pre>
      </Card>
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
        description="Read-only reporting projections with audited CSV/Excel exports."
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
            { label: "ROI paid (minor)", value: money.totalRoiPaidMinor ?? "0" },
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
    <div>
      <AdminPageHeader
        title="Security center"
        description="Security events and recent administrative activity."
      />
      <Card className="p-4">
        <pre className="overflow-x-auto text-xs">{JSON.stringify(payload, null, 2)}</pre>
      </Card>
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
          : JSON.stringify(setting.value),
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
        title="System settings"
        description="Editable platform configuration. Changes persist immediately."
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
  const [health, setHealth] = useState<Record<string, unknown> | null>(null);

  const load = useCallback(async () => {
    const result = await getAdminJson<Record<string, unknown>>("/api/admin/system/health");
    if (result.error) {
      setError({ message: result.error, ...(result.status ? { status: result.status } : {}) });
      setState("error");
      return;
    }
    setHealth(result.data ?? null);
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
    <div>
      <AdminPageHeader
        title="System health"
        description="Release metadata, queue health, and runtime diagnostics."
      />
      <AdminMetricGrid
        metrics={[
          { label: "Application", value: String(health?.application ?? "unknown") },
          { label: "Version", value: String(health?.version ?? "unknown") },
          { label: "Git commit", value: String(health?.gitCommit ?? "unknown") },
          { label: "Release tag", value: String(health?.releaseTag ?? "unknown") },
        ]}
      />
      <Card className="p-4">
        <pre className="overflow-x-auto text-xs">{JSON.stringify(health, null, 2)}</pre>
      </Card>
    </div>
  );
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
        title="Email templates"
        description="Identity and transactional email templates managed by the platform."
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
        <AdminEmptyBlock title="No email templates" />
      ) : null}
      {state === "ready" && rows.length > 0 ? (
        <AdminDataTable
          caption="Email templates"
          rows={rows}
          columns={[
            { key: "key", header: "Key", cell: (row) => row.key },
            {
              key: "status",
              header: "Status",
              cell: (row) => <Badge variant="secondary">{row.status}</Badge>,
            },
            { key: "version", header: "Version", cell: (row) => row.currentVersion },
          ]}
        />
      ) : null}
    </div>
  );
}
