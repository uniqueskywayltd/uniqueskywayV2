"use client";

import Link from "next/link";
import { useState } from "react";
import { Lock, Mail } from "lucide-react";

import { Alert, AlertDescription, Button, Checkbox, Input } from "@/components/ui";

import { postAuthJson } from "../api-client";
import { AuthField, AuthInputIcon } from "./auth-field";
import { authLinkClass, authSubmitClass } from "./auth-shell";

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(formData: FormData) {
    setPending(true);
    setError(null);
    setMessage(null);

    const result = await postAuthJson<{ email: string }>("/api/auth/login", {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      rememberMe: formData.get("rememberMe") === "on",
    });

    if (result.error) {
      setError(result.error);
    } else {
      setMessage(`Signed in as ${result.data?.email ?? "your account"}.`);
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

      <AuthField
        label="Password"
        htmlFor="password"
        action={
          <Link href="/auth/forgot-password" className={`${authLinkClass} text-xs`}>
            Forgot password?
          </Link>
        }
      >
        <AuthInputIcon icon={<Lock className="h-4 w-4" aria-hidden />}>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            required
            disabled={pending}
          />
        </AuthInputIcon>
      </AuthField>

      <div className="flex items-center gap-2.5">
        <Checkbox id="rememberMe" name="rememberMe" disabled={pending} />
        <label htmlFor="rememberMe" className="text-sm font-medium text-foreground/80">
          Keep me signed in
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
        {pending ? "Signing you in..." : "Sign in"}
      </Button>
    </form>
  );
}
