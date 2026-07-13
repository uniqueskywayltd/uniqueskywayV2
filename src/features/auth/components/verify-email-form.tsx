"use client";

import { useState } from "react";

import { Alert, AlertDescription, Button, Checkbox, Input, Label } from "@/components/ui";

import { postAuthJson } from "../api-client";

export function VerifyEmailForm() {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(formData: FormData) {
    setPending(true);
    setError(null);
    setMessage(null);

    const result = await postAuthJson<{ email: string }>("/api/auth/verify-email", {
      email: String(formData.get("email") ?? ""),
      token: String(formData.get("token") ?? ""),
      rememberMe: formData.get("rememberMe") === "on",
    });

    if (result.error) {
      setError(result.error);
    } else {
      setMessage(`Email verified for ${result.data?.email ?? "your account"}.`);
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
        <Label htmlFor="token">Verification code</Label>
        <Input id="token" name="token" inputMode="numeric" autoComplete="one-time-code" required />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="rememberMe" name="rememberMe" defaultChecked />
        <Label htmlFor="rememberMe">Remember this browser</Label>
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
        {pending ? "Verifying" : "Verify email"}
      </Button>
    </form>
  );
}
