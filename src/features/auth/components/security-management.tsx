"use client";

import { useEffect, useState } from "react";

import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  EmptyState,
  DateDisplay,
} from "@/components/ui";
import { getAuthJson, postAuthJson } from "../api-client";
import { MonitorSmartphone } from "lucide-react";

interface TrustedDevice {
  id: string;
  label: string | null;
  lastUsedAt: string | null;
  expiresAt: string;
  revokedAt: string | null;
  createdAt: string;
}

interface SessionRecord {
  id: string;
  status: string;
  lastSeenAt: string | null;
  expiresAt: string;
  revokedAt: string | null;
  createdAt: string;
  current: boolean;
}

export function TrustedDevicesClient() {
  const [devices, setDevices] = useState<TrustedDevice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    const result = await getAuthJson<{ devices: TrustedDevice[] }>("/api/auth/trusted-devices");
    if (result.error) setError(result.error);
    else setDevices(result.data?.devices ?? []);
  }

  async function revoke(trustedDeviceId: string) {
    const result = await postAuthJson("/api/auth/trusted-devices/revoke", { trustedDeviceId });
    if (result.error) setError(result.error);
    else await load();
  }

  useEffect(() => {
    let active = true;
    void getAuthJson<{ devices: TrustedDevice[] }>("/api/auth/trusted-devices").then((result) => {
      if (!active) return;
      if (result.error) setError(result.error);
      else setDevices(result.data?.devices ?? []);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading trusted devices…</p>;
  }

  return (
    <div className="space-y-4">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {devices.length === 0 ? (
        <EmptyState
          icon={MonitorSmartphone}
          title="No trusted devices"
          description="Devices you trust will appear here after sign-in."
        />
      ) : (
        devices.map((device) => (
          <article
            key={device.id}
            className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold text-foreground">
                {device.label ?? "Trusted device"}
              </h3>
              {device.revokedAt ? (
                <Badge variant="outline">Revoked</Badge>
              ) : (
                <Badge>Trusted</Badge>
              )}
            </div>
            <div className="mt-3 space-y-1 text-sm text-muted-foreground">
              <p>
                Last used:{" "}
                {device.lastUsedAt ? <DateDisplay value={device.lastUsedAt} /> : "Never"}
              </p>
              <p>
                Expires: <DateDisplay value={device.expiresAt} />
              </p>
            </div>
            {!device.revokedAt ? (
              <Button
                type="button"
                variant="outline"
                className="mt-4"
                onClick={() => void revoke(device.id)}
              >
                Revoke device
              </Button>
            ) : null}
          </article>
        ))
      )}
    </div>
  );
}

export function SessionsClient() {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    const result = await getAuthJson<{ sessions: SessionRecord[] }>("/api/auth/sessions");
    if (result.error) setError(result.error);
    else setSessions(result.data?.sessions ?? []);
  }

  async function revoke(mode: "current" | "others") {
    const result = await postAuthJson("/api/auth/sessions/revoke", { mode });
    if (result.error) setError(result.error);
    else await load();
  }

  useEffect(() => {
    let active = true;
    void getAuthJson<{ sessions: SessionRecord[] }>("/api/auth/sessions").then((result) => {
      if (!active) return;
      if (result.error) setError(result.error);
      else setSessions(result.data?.sessions ?? []);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading sessions…</p>;
  }

  return (
    <div className="space-y-4">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => void revoke("others")}>
          Revoke other sessions
        </Button>
      </div>
      {sessions.length === 0 ? (
        <EmptyState
          icon={MonitorSmartphone}
          title="No active sessions"
          description="Authenticated sessions for this account appear here."
        />
      ) : (
        sessions.map((session) => (
          <article
            key={session.id}
            className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold text-foreground">Session</h3>
              {session.current ? (
                <Badge>Current</Badge>
              ) : (
                <Badge variant="outline">{session.status}</Badge>
              )}
            </div>
            <div className="mt-3 space-y-1 text-sm text-muted-foreground">
              <p>
                Last activity:{" "}
                {session.lastSeenAt ? <DateDisplay value={session.lastSeenAt} /> : "Unknown"}
              </p>
              <p>
                Expires: <DateDisplay value={session.expiresAt} />
              </p>
            </div>
            {session.current ? (
              <Button
                type="button"
                variant="outline"
                className="mt-4"
                onClick={() => void revoke("current")}
              >
                Sign out current session
              </Button>
            ) : null}
          </article>
        ))
      )}
    </div>
  );
}
