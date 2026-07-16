"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { KeyRound, Mail } from "lucide-react";

import { OTP_MAX_LENGTH, sanitizeOtpInput } from "@/application/auth/otp";
import { Alert, AlertDescription, Button, Checkbox, Input } from "@/components/ui";
import { useI18n } from "@/features/i18n/i18n-provider";
import { appPath } from "@/lib/app-path";

import { postAuthJson } from "../api-client";
import { AuthField, AuthInputIcon } from "./auth-field";
import { authSubmitClass } from "./auth-shell";

function VerifyEmailFormInner() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenHash = searchParams.get("token_hash") ?? searchParams.get("tokenHash");
  const typeParam = searchParams.get("type");
  const linkType =
    typeParam === "email" || typeParam === "magiclink" || typeParam === "signup"
      ? typeParam
      : "signup";

  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(Boolean(tokenHash));
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [token, setToken] = useState(searchParams.get("token") ?? "");

  useEffect(() => {
    if (!tokenHash) return;

    let cancelled = false;

    void postAuthJson<{
      email?: string;
      redirectTo?: "/admin" | "/dashboard";
      sessionCreated?: boolean;
      message?: string;
    }>("/api/auth/verify-email", {
      tokenHash,
      type: linkType,
      ...(email ? { email } : {}),
      rememberMe: true,
    }).then((result) => {
      if (cancelled) return;
      if (result.error) {
        setError(result.error);
        setPending(false);
        return;
      }

      if (result.data?.sessionCreated && result.data.redirectTo) {
        router.replace(appPath(result.data.redirectTo));
        router.refresh();
        return;
      }

      setMessage(result.data?.message ?? t("auth.email_verified_sign_in"));
      setPending(false);
    });

    return () => {
      cancelled = true;
    };
  }, [email, linkType, router, t, tokenHash]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);

    const result = await postAuthJson<{
      email: string;
      redirectTo?: "/admin" | "/dashboard";
      sessionCreated?: boolean;
      message?: string;
    }>("/api/auth/verify-email", {
      email,
      token,
      rememberMe: true,
    });

    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }

    if (result.data?.sessionCreated !== false) {
      const redirectTo = result.data?.redirectTo === "/admin" ? "/admin" : "/dashboard";
      router.replace(appPath(redirectTo));
      router.refresh();
      return;
    }

    setMessage(result.data?.message ?? t("auth.email_verified_sign_in"));
    setPending(false);
  }

  return (
    <form onSubmit={submit} className="space-y-5" aria-busy={pending}>
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
            value={email}
            onChange={(event) => setEmail(event.target.value)}
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
            value={token}
            onChange={(event) => setToken(sanitizeOtpInput(event.target.value))}
            maxLength={OTP_MAX_LENGTH}
            placeholder="Enter code from email"
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

export function VerifyEmailForm() {
  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-lg bg-muted" aria-hidden />}>
      <VerifyEmailFormInner />
    </Suspense>
  );
}
