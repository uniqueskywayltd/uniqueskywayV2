"use client";

import { useState } from "react";
import Link from "next/link";

import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from "@/components/ui";

import { postCustomerJson } from "../api-client";

export function SecurityCenter() {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <PasswordChangeCard />
      <Card>
        <CardHeader>
          <CardTitle>Devices and sessions</CardTitle>
          <CardDescription>Review trusted browsers and active Supabase sessions.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/account/security/trusted-devices">Trusted devices</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/account/security/sessions">Active sessions</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function PasswordChangeCard() {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(formData: FormData) {
    setPending(true);
    setError(null);
    setMessage(null);

    const result = await postCustomerJson("/api/auth/password/change", {
      currentPassword: String(formData.get("currentPassword") ?? ""),
      newPassword: String(formData.get("newPassword") ?? ""),
    });

    if (result.error) setError(result.error);
    else setMessage("Password changed.");
    setPending(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Password</CardTitle>
        <CardDescription>Change the password for this account.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current password</Label>
            <Input
              id="currentPassword"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New password</Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              required
            />
          </div>
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          {message ? (
            <Alert>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          ) : null}
          <Button type="submit" disabled={pending}>
            {pending ? "Changing" : "Change password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
