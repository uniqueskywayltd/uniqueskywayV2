"use client";

import { useEffect, useState } from "react";

import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DateDisplay,
} from "@/components/ui";

import { getAuthJson, postAuthJson } from "../api-client";

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
    });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-4">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {devices.map((device) => (
        <Card key={device.id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3 text-base">
              {device.label ?? "Trusted device"}
              {device.revokedAt ? <Badge variant="outline">Revoked</Badge> : <Badge>Trusted</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Last used: {device.lastUsedAt ? <DateDisplay value={device.lastUsedAt} /> : "Never"}
            </p>
            <p>
              Expires: <DateDisplay value={device.expiresAt} />
            </p>
            {!device.revokedAt ? (
              <Button type="button" variant="outline" onClick={() => void revoke(device.id)}>
                Revoke device
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function SessionsClient() {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

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
    });

    return () => {
      active = false;
    };
  }, []);

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
      {sessions.map((session) => (
        <Card key={session.id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3 text-base">
              Session
              {session.current ? (
                <Badge>Current</Badge>
              ) : (
                <Badge variant="outline">{session.status}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Last activity:{" "}
              {session.lastSeenAt ? <DateDisplay value={session.lastSeenAt} /> : "Unknown"}
            </p>
            <p>
              Expires: <DateDisplay value={session.expiresAt} />
            </p>
            {session.current ? (
              <Button type="button" variant="outline" onClick={() => void revoke("current")}>
                Sign out current session
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
