"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { KeyRound, Lock, Mail } from "lucide-react";

import { OTP_MAX_LENGTH, isValidOtp, sanitizeOtpInput } from "@/application/auth/otp";
import {
  Alert,
  AlertDescription,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from "@/components/ui";
import { useI18n } from "@/features/i18n/i18n-provider";
import { appPath } from "@/lib/app-path";

import { postAuthJson } from "../api-client";
import { AuthField, AuthInputIcon } from "./auth-field";
import { authSubmitClass } from "./auth-shell";
import { PasswordInput } from "./password-input";

export function ForgotPasswordForm() {
  const { t } = useI18n();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpPending, setOtpPending] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetPending, setResetPending] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resendSeconds, setResendSeconds] = useState(0);
  const verifyingOtpRef = useRef(false);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = window.setTimeout(() => setResendSeconds((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendSeconds]);

  function resetResetState() {
    setOtp("");
    setOtpVerified(false);
    setOtpPending(false);
    setOtpError(null);
    setPassword("");
    setConfirmPassword("");
    setResetPending(false);
    setResetError(null);
    setResetMessage(null);
    verifyingOtpRef.current = false;
  }

  async function submit(formData: FormData) {
    setPending(true);
    setError(null);
    const email = String(formData.get("email") ?? "")
      .trim()
      .toLowerCase();

    const result = await postAuthJson("/api/auth/password/forgot", { email });

    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }

    setResetEmail(email);
    resetResetState();
    setResendSeconds(60);
    setPending(false);
    setResetOpen(true);
  }

  async function verifyRecoveryOtp(token: string) {
    if (verifyingOtpRef.current || otpVerified) return;
    verifyingOtpRef.current = true;
    setOtpPending(true);
    setOtpError(null);

    const result = await postAuthJson<{ verified: true; email: string }>(
      "/api/auth/password/verify-recovery-otp",
      {
        email: resetEmail,
        token: sanitizeOtpInput(token),
      },
    );

    if (result.error) {
      setOtpError(result.error);
      setOtpPending(false);
      verifyingOtpRef.current = false;
      return;
    }

    setOtpVerified(true);
    setOtpPending(false);
    verifyingOtpRef.current = false;
  }

  async function resendResetCode() {
    if (resendSeconds > 0 || !resetEmail) return;
    setResetError(null);
    setOtpError(null);
    const result = await postAuthJson("/api/auth/password/forgot", { email: resetEmail });
    if (result.error) {
      setResetError(result.error);
      return;
    }
    setOtp("");
    setOtpVerified(false);
    setResetMessage(null);
    verifyingOtpRef.current = false;
    setResendSeconds(60);
  }

  async function completeReset() {
    if (!otpVerified) {
      setResetError(t("auth.reset_verify_otp_first"));
      return;
    }
    if (password !== confirmPassword) {
      setResetError(t("auth.passwords_mismatch"));
      return;
    }

    setResetPending(true);
    setResetError(null);

    const result = await postAuthJson<{
      userId: string;
      redirectTo?: "/admin" | "/dashboard";
    }>("/api/auth/password/reset", {
      password,
      confirmPassword,
    });

    if (result.error) {
      setResetError(result.error);
      setResetPending(false);
      return;
    }

    setResetMessage(t("auth.reset_success_signing_in"));
    const redirectTo = result.data?.redirectTo === "/admin" ? "/admin" : "/dashboard";
    window.setTimeout(() => {
      router.replace(appPath(redirectTo));
      router.refresh();
    }, 1200);
  }

  return (
    <>
      <form action={submit} className="space-y-5" aria-busy={pending}>
        <AuthField label={t("auth.email")} htmlFor="email">
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

        <Button type="submit" className={authSubmitClass} disabled={pending}>
          {pending ? t("auth.sending_reset") : t("auth.send_reset")}
        </Button>
      </form>

      <Dialog
        open={resetOpen}
        onOpenChange={(open) => {
          setResetOpen(open);
          if (!open) resetResetState();
        }}
      >
        <DialogContent
          className="sm:max-w-md"
          onPointerDownOutside={(event) => event.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>{t("auth.reset_modal_title")}</DialogTitle>
            <DialogDescription>
              {t("auth.reset_modal_body")}
              <br />
              <span className="font-medium text-foreground">{resetEmail}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <AuthField label={t("auth.reset_code")} htmlFor="reset-otp">
              <AuthInputIcon icon={<KeyRound className="h-4 w-4" aria-hidden />}>
                <Input
                  id="reset-otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={OTP_MAX_LENGTH}
                  value={otp}
                  disabled={otpPending || otpVerified || resetPending}
                  onChange={(event) => {
                    const next = sanitizeOtpInput(event.target.value);
                    setOtp(next);
                    if (isValidOtp(next) && !otpVerified && !verifyingOtpRef.current) {
                      void verifyRecoveryOtp(next);
                    }
                  }}
                  placeholder={t("auth.reset_code_placeholder")}
                />
              </AuthInputIcon>
            </AuthField>

            {otpVerified ? (
              <Alert>
                <AlertDescription>{t("auth.reset_otp_verified")}</AlertDescription>
              </Alert>
            ) : null}

            {otpError ? (
              <Alert variant="destructive">
                <AlertDescription>{otpError}</AlertDescription>
              </Alert>
            ) : null}

            <AuthField label={t("auth.new_password")} htmlFor="reset-password">
              <AuthInputIcon icon={<Lock className="h-4 w-4" aria-hidden />}>
                <PasswordInput
                  id="reset-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  disabled={!otpVerified || resetPending}
                  className="pl-10"
                />
              </AuthInputIcon>
            </AuthField>

            <AuthField label={t("auth.confirm_password")} htmlFor="reset-confirm">
              <AuthInputIcon icon={<Lock className="h-4 w-4" aria-hidden />}>
                <PasswordInput
                  id="reset-confirm"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  disabled={!otpVerified || resetPending}
                  className="pl-10"
                />
              </AuthInputIcon>
            </AuthField>

            {resetError ? (
              <Alert variant="destructive">
                <AlertDescription>{resetError}</AlertDescription>
              </Alert>
            ) : null}
            {resetMessage ? (
              <Alert>
                <AlertDescription>{resetMessage}</AlertDescription>
              </Alert>
            ) : null}

            <DialogFooter className="gap-2 sm:flex-col">
              <Button
                type="button"
                className={authSubmitClass}
                disabled={!otpVerified || resetPending || password.length < 8}
                onClick={() => void completeReset()}
              >
                {resetPending ? t("auth.resetting_password") : t("auth.reset_password_cta")}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={resetPending || otpPending || resendSeconds > 0}
                onClick={() => void resendResetCode()}
              >
                {resendSeconds > 0
                  ? t("auth.resend_wait", { seconds: resendSeconds })
                  : t("auth.resend_code")}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ResetPasswordForm() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-muted" aria-hidden />}>
      <ResetPasswordFormInner />
    </Suspense>
  );
}

function ResetPasswordFormInner() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawToken = searchParams.get("token");
  const tokenHash =
    searchParams.get("token_hash") ??
    searchParams.get("tokenHash") ??
    (rawToken && rawToken.length > 20 ? rawToken : null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [otp, setOtp] = useState(
    rawToken && rawToken.length <= OTP_MAX_LENGTH ? sanitizeOtpInput(rawToken) : "",
  );
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpPending, setOtpPending] = useState(Boolean(tokenHash));
  const [email, setEmail] = useState((searchParams.get("email") ?? "").trim().toLowerCase());
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const verifyingOtpRef = useRef(false);

  useEffect(() => {
    if (!tokenHash || otpVerified || verifyingOtpRef.current) return;

    let cancelled = false;
    verifyingOtpRef.current = true;
    setOtpPending(true);
    setError(null);

    void postAuthJson<{ verified: true; email: string }>("/api/auth/password/verify-recovery-otp", {
      tokenHash,
      ...(email ? { email } : {}),
    }).then((result) => {
      if (cancelled) return;
      if (result.error) {
        setError(result.error);
        setOtpPending(false);
        verifyingOtpRef.current = false;
        return;
      }

      if (result.data?.email) {
        setEmail(result.data.email);
      }
      setOtpVerified(true);
      setOtpPending(false);
      setMessage(t("auth.reset_otp_verified"));
      verifyingOtpRef.current = false;
    });

    return () => {
      cancelled = true;
    };
  }, [email, otpVerified, t, tokenHash]);

  async function verifyRecoveryOtp(token: string) {
    if (verifyingOtpRef.current || otpVerified || !email) return;
    verifyingOtpRef.current = true;
    setOtpPending(true);
    setError(null);

    const result = await postAuthJson<{ verified: true; email: string }>(
      "/api/auth/password/verify-recovery-otp",
      {
        email,
        token: sanitizeOtpInput(token),
      },
    );

    if (result.error) {
      setError(result.error);
      setOtpPending(false);
      verifyingOtpRef.current = false;
      return;
    }

    setOtpVerified(true);
    setOtpPending(false);
    setMessage(t("auth.reset_otp_verified"));
    verifyingOtpRef.current = false;
  }

  async function submit() {
    setPending(true);
    setError(null);
    setMessage(null);

    if (password !== confirmPassword) {
      setError(t("auth.passwords_mismatch"));
      setPending(false);
      return;
    }

    const payload =
      otpVerified || !otp
        ? { password, confirmPassword }
        : {
            email,
            token: sanitizeOtpInput(otp),
            password,
            confirmPassword,
          };

    const result = await postAuthJson<{
      userId: string;
      redirectTo?: "/admin" | "/dashboard";
    }>("/api/auth/password/reset", payload);

    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }

    setMessage(t("auth.reset_success_signing_in"));
    const redirectTo = result.data?.redirectTo === "/admin" ? "/admin" : "/dashboard";
    window.setTimeout(() => {
      router.replace(appPath(redirectTo));
      router.refresh();
    }, 1200);
  }

  return (
    <form
      className="space-y-5"
      aria-busy={pending || otpPending}
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <AuthField label={t("auth.email")} htmlFor="email">
        <AuthInputIcon icon={<Mail className="h-4 w-4" aria-hidden />}>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required={!otpVerified}
            disabled={pending || otpVerified || otpPending}
            value={email}
            onChange={(event) => setEmail(event.target.value.trim().toLowerCase())}
          />
        </AuthInputIcon>
      </AuthField>

      <AuthField label={t("auth.reset_code")} htmlFor="token">
        <AuthInputIcon icon={<KeyRound className="h-4 w-4" aria-hidden />}>
          <Input
            id="token"
            name="token"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={OTP_MAX_LENGTH}
            required={!otpVerified}
            disabled={pending || otpVerified || otpPending}
            value={otp}
            onChange={(event) => {
              const next = sanitizeOtpInput(event.target.value);
              setOtp(next);
              if (isValidOtp(next) && email && !otpVerified && !verifyingOtpRef.current) {
                void verifyRecoveryOtp(next);
              }
            }}
            placeholder={t("auth.reset_code_placeholder")}
          />
        </AuthInputIcon>
      </AuthField>

      {otpVerified ? (
        <Alert>
          <AlertDescription>{t("auth.reset_otp_verified")}</AlertDescription>
        </Alert>
      ) : null}

      <AuthField label={t("auth.new_password")} htmlFor="password">
        <AuthInputIcon icon={<Lock className="h-4 w-4" aria-hidden />}>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            required
            minLength={8}
            disabled={pending || (!otpVerified && otp.length === 0)}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="pl-10"
          />
        </AuthInputIcon>
      </AuthField>

      <AuthField label={t("auth.confirm_password")} htmlFor="confirmPassword">
        <AuthInputIcon icon={<Lock className="h-4 w-4" aria-hidden />}>
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            autoComplete="new-password"
            required
            minLength={8}
            disabled={pending || (!otpVerified && otp.length === 0)}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="pl-10"
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

      <Button
        type="submit"
        className={authSubmitClass}
        disabled={
          pending || otpPending || password.length < 8 || (!otpVerified && !isValidOtp(otp))
        }
      >
        {pending ? t("auth.resetting_password") : t("auth.reset_password_cta")}
      </Button>
    </form>
  );
}

export function ChangePasswordForm() {
  const { t } = useI18n();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function submit() {
    setPending(true);
    setError(null);
    setMessage(null);

    if (password !== confirmPassword) {
      setError(t("auth.passwords_mismatch"));
      setPending(false);
      return;
    }

    const result = await postAuthJson<{
      changed: true;
      redirectTo?: "/admin" | "/dashboard" | "/auth/change-password";
    }>("/api/auth/password/change", {
      currentPassword,
      newPassword: password,
    });

    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }

    setMessage(t("auth.password_updated_continuing"));
    const redirectTo = result.data?.redirectTo === "/admin" ? "/admin" : "/dashboard";
    window.setTimeout(() => {
      router.replace(appPath(redirectTo));
      router.refresh();
    }, 800);
  }

  return (
    <form
      className="space-y-5"
      aria-busy={pending}
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <AuthField label={t("auth.current_password")} htmlFor="currentPassword">
        <AuthInputIcon icon={<Lock className="h-4 w-4" aria-hidden />}>
          <PasswordInput
            id="currentPassword"
            name="currentPassword"
            autoComplete="current-password"
            required
            minLength={8}
            disabled={pending}
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            className="pl-10"
          />
        </AuthInputIcon>
      </AuthField>

      <AuthField label={t("auth.new_password")} htmlFor="newPassword">
        <AuthInputIcon icon={<Lock className="h-4 w-4" aria-hidden />}>
          <PasswordInput
            id="newPassword"
            name="newPassword"
            autoComplete="new-password"
            required
            minLength={8}
            disabled={pending}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="pl-10"
          />
        </AuthInputIcon>
      </AuthField>

      <AuthField label={t("auth.confirm_password")} htmlFor="confirmNewPassword">
        <AuthInputIcon icon={<Lock className="h-4 w-4" aria-hidden />}>
          <PasswordInput
            id="confirmNewPassword"
            name="confirmNewPassword"
            autoComplete="new-password"
            required
            minLength={8}
            disabled={pending}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="pl-10"
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

      <Button
        type="submit"
        className={authSubmitClass}
        disabled={pending || password.length < 8 || currentPassword.length < 8}
      >
        {pending ? t("auth.updating") : t("auth.save_new_password")}
      </Button>
    </form>
  );
}
