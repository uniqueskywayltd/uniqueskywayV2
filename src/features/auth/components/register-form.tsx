"use client";

import { useState } from "react";
import { Lock, Mail, User } from "lucide-react";

import { Alert, AlertDescription, Button, Checkbox, Input } from "@/components/ui";

import { postAuthJson } from "../api-client";
import { AuthField, AuthInputIcon } from "./auth-field";
import { authSubmitClass } from "./auth-shell";

export function RegisterForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(formData: FormData) {
    setPending(true);
    setError(null);
    setMessage(null);

    const result = await postAuthJson<{ email: string }>("/api/auth/register", {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      displayName: String(formData.get("displayName") ?? ""),
      rememberMe: formData.get("rememberMe") === "on",
    });

    if (result.error) {
      setError(result.error);
    } else {
      setMessage(`Verification code queued for ${result.data?.email ?? "your email"}.`);
    }

    setPending(false);
  }

  return (
    <form action={submit} className="space-y-5" aria-busy={pending}>
      <AuthField label="Name" htmlFor="displayName">
        <AuthInputIcon icon={<User className="h-4 w-4" aria-hidden />}>
          <Input
            id="displayName"
            name="displayName"
            autoComplete="name"
            placeholder="Your name"
            disabled={pending}
          />
        </AuthInputIcon>
      </AuthField>

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

      <AuthField label="Password" htmlFor="password">
        <AuthInputIcon icon={<Lock className="h-4 w-4" aria-hidden />}>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Create a password"
            autoComplete="new-password"
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
        {pending ? "Creating account" : "Create account"}
      </Button>
    </form>
  );
}
