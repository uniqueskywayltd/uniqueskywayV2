"use client";

import { useState } from "react";

import { Alert, AlertDescription, Button, Input, Label } from "@/components/ui";

import { postAuthJson } from "../api-client";

export function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(formData: FormData) {
    setPending(true);
    setError(null);
    setMessage(null);

    const result = await postAuthJson("/api/auth/password/forgot", {
      email: String(formData.get("email") ?? ""),
    });

    if (result.error) {
      setError(result.error);
    } else {
      setMessage("If the account exists, a reset code has been queued.");
    }

    setPending(false);
  }

  return (
    <form action={submit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
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
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Sending" : "Send reset code"}
      </Button>
    </form>
  );
}

export function ResetPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(formData: FormData) {
    setPending(true);
    setError(null);
    setMessage(null);

    const result = await postAuthJson("/api/auth/password/reset", {
      email: String(formData.get("email") ?? ""),
      token: String(formData.get("token") ?? ""),
      password: String(formData.get("password") ?? ""),
    });

    if (result.error) {
      setError(result.error);
    } else {
      setMessage("Password reset complete.");
    }

    setPending(false);
  }

  return (
    <form action={submit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="token">Reset code</Label>
        <Input id="token" name="token" inputMode="numeric" autoComplete="one-time-code" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" required />
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
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Resetting" : "Reset password"}
      </Button>
    </form>
  );
}
