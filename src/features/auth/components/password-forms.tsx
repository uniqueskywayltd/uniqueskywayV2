"use client";

import { useState } from "react";
import { KeyRound, Lock, Mail } from "lucide-react";

import { OTP_MAX_LENGTH, sanitizeOtpInput } from "@/application/auth/otp";
import { Alert, AlertDescription, Button, Input } from "@/components/ui";

import { postAuthJson } from "../api-client";
import { AuthField, AuthInputIcon } from "./auth-field";
import { authSubmitClass } from "./auth-shell";

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

      <AuthField label="Reset code" htmlFor="token">
        <AuthInputIcon icon={<KeyRound className="h-4 w-4" aria-hidden />}>
          <Input
            id="token"
            name="token"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={OTP_MAX_LENGTH}
            required
            disabled={pending}
            onChange={(event) => {
              event.currentTarget.value = sanitizeOtpInput(event.currentTarget.value);
            }}
            placeholder="Enter code from email"
          />
        </AuthInputIcon>
      </AuthField>

      <AuthField label="New password" htmlFor="password">
        <AuthInputIcon icon={<Lock className="h-4 w-4" aria-hidden />}>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Enter a new password"
            autoComplete="new-password"
            required
            disabled={pending}
          />
        </AuthInputIcon>
      </AuthField>

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
        {pending ? "Resetting" : "Reset password"}
      </Button>
    </form>
  );
}
