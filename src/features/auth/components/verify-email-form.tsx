"use client";

import { useState } from "react";
import { KeyRound, Mail } from "lucide-react";

import { Alert, AlertDescription, Button, Checkbox, Input } from "@/components/ui";

import { postAuthJson } from "../api-client";
import { AuthField, AuthInputIcon } from "./auth-field";
import { authSubmitClass } from "./auth-shell";

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
    <form action={submit} className="space-y-5" aria-busy={pending}>
      <AuthField label="Email address" htmlFor="email">
        <AuthInputIcon icon={<Mail className="h-4 w-4" aria-hidden />}>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
            disabled={pending}
          />
        </AuthInputIcon>
      </AuthField>

      <AuthField label="Verification code" htmlFor="token">
        <AuthInputIcon icon={<KeyRound className="h-4 w-4" aria-hidden />}>
          <Input
            id="token"
            name="token"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            disabled={pending}
          />
        </AuthInputIcon>
      </AuthField>

      <div className="flex items-center gap-2.5">
        <Checkbox id="rememberMe" name="rememberMe" defaultChecked disabled={pending} />
        <label htmlFor="rememberMe" className="text-sm font-medium text-foreground/80">
          Remember this browser
        </label>
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

      <Button type="submit" className={authSubmitClass} disabled={pending}>
        {pending ? "Verifying" : "Verify email"}
      </Button>
    </form>
  );
}
