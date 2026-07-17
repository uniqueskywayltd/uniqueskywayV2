"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { KeyRound, Lock, Mail } from "lucide-react";

import { OTP_MAX_LENGTH, isValidOtp, sanitizeOtpInput } from "@/application/auth/otp";
import {
  Alert,
  AlertDescription,
  Button,
  Checkbox,
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
import { authLinkClass, authSubmitClass } from "./auth-shell";
import { PasswordInput } from "./password-input";

export function LoginForm() {
  const { t } = useI18n();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [forgotPending, setForgotPending] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);

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

  async function submit(formData: FormData) {
    setPending(true);
    setError(null);
    setMessage(null);

    const result = await postAuthJson<{
      email: string;
      redirectTo?: "/admin" | "/dashboard" | "/auth/change-password";
      mustChangePassword?: boolean;
    }>("/api/auth/login", {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      rememberMe: formData.get("rememberMe") === "on",
    });

    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }

    const redirectTo =
      result.data?.redirectTo === "/auth/change-password"
        ? "/auth/change-password"
        : result.data?.redirectTo === "/admin"
          ? "/admin"
          : "/dashboard";
    setMessage(
      redirectTo === "/auth/change-password"
        ? t("auth.signed_in_choose_password")
        : t("auth.signed_in_as", { email: result.data?.email ?? t("chrome.account") }),
    );
    router.replace(appPath(redirectTo));
    router.refresh();
  }

  function openForgotModal() {
    setForgotError(null);
    setForgotOpen(true);
  }

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

  async function sendResetCode(email: string) {
    setForgotPending(true);
    setForgotError(null);

    const result = await postAuthJson("/api/auth/password/forgot", { email });

    if (result.error) {
      setForgotError(result.error);
      setForgotPending(false);
      return;
    }

    setResetEmail(email.trim().toLowerCase());
    resetResetState();
    setResendSeconds(60);
    setForgotPending(false);
    setForgotOpen(false);
    setResetOpen(true);
  }

  async function submitForgot(formData: FormData) {
    await sendResetCode(String(formData.get("email") ?? ""));
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

        <AuthField
          label={t("auth.password")}
          htmlFor="password"
          action={
            <button type="button" className={`${authLinkClass} text-xs`} onClick={openForgotModal}>
              {t("auth.forgot_password")}
            </button>
          }
        >
          <AuthInputIcon icon={<Lock className="h-4 w-4" aria-hidden />}>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder={t("auth.password")}
              autoComplete="current-password"
              required
              disabled={pending}
            />
          </AuthInputIcon>
        </AuthField>

        <div className="flex items-center gap-2.5">
          <Checkbox id="rememberMe" name="rememberMe" disabled={pending} />
          <label htmlFor="rememberMe" className="text-sm font-medium text-foreground/80">
            {t("auth.keep_signed_in")}
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
          {pending ? t("auth.signing_in") : t("auth.sign_in_cta")}
        </Button>
      </form>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("auth.forgot_modal_title")}</DialogTitle>
            <DialogDescription>{t("auth.forgot_modal_body")}</DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void submitForgot(new FormData(event.currentTarget));
            }}
          >
            <AuthField label={t("auth.email")} htmlFor="forgot-email">
              <AuthInputIcon icon={<Mail className="h-4 w-4" aria-hidden />}>
                <Input
                  id="forgot-email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  disabled={forgotPending}
                  defaultValue={resetEmail}
                />
              </AuthInputIcon>
            </AuthField>

            {forgotError ? (
              <Alert variant="destructive">
                <AlertDescription>{forgotError}</AlertDescription>
              </Alert>
            ) : null}

            <DialogFooter>
              <Button type="submit" className={authSubmitClass} disabled={forgotPending}>
                {forgotPending ? t("auth.sending_reset") : t("auth.send_reset")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
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
                <Button
                  type="button"
                  variant="ghost"
                  disabled={resetPending || otpPending}
                  onClick={() => {
                    setResetOpen(false);
                    setForgotOpen(true);
                  }}
                >
                  {t("auth.change_email")}
                </Button>
              </div>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <p className="sr-only">
        <Link href="/auth/forgot-password">{t("auth.forgot_password")}</Link>
      </p>
    </>
  );
}
