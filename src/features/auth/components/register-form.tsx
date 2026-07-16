"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState, type FormEvent } from "react";
import { Gift, Lock, Mail, User, UserCircle } from "lucide-react";

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
import { OTP_MAX_LENGTH, isValidOtp, sanitizeOtpInput } from "@/application/auth/otp";
import { useI18n } from "@/features/i18n/i18n-provider";
import { appPath } from "@/lib/app-path";
import { cn } from "@/lib/utils";

import { getAuthJson, postAuthJson } from "../api-client";
import { AuthField, AuthInputIcon, authCalloutClass, authCheckboxClass } from "./auth-field";
import { isMathCaptchaCorrect, MathCaptchaField, randomMathDigit } from "./math-captcha-field";
import { PasswordInput } from "./password-input";
import { PlanSelectionField } from "./plan-selection-field";
import { authLinkClass, authSubmitClass } from "./auth-shell";

const REFERRAL_STORAGE_KEY = "usw_referral_code";
const PLAN_INTENT_STORAGE_KEY = "usw_plan_intent";
const RESEND_COOLDOWN_SECONDS = 60;
const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,24}$/;

function getPasswordStrength(password: string) {
  if (!password) return { score: 0, label: "", color: "bg-muted" };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 2) return { score: 1, label: "Weak", color: "bg-red-500" };
  if (score <= 3) return { score: 2, label: "Fair", color: "bg-amber-500" };
  return { score: 3, label: "Strong", color: "bg-emerald-500" };
}

function RegisterFormInner() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const referralFromUrl = searchParams.get("referral") ?? searchParams.get("ref") ?? "";
  const planIntentFromUrl = searchParams.get("intent") ?? "";

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referral, setReferral] = useState(referralFromUrl);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [planIntent, setPlanIntent] = useState(planIntentFromUrl);
  const [captchaA] = useState(() => randomMathDigit());
  const [captchaB] = useState(() => randomMathDigit());
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [usernameTakenError, setUsernameTakenError] = useState<string | null>(null);
  const [emailTakenError, setEmailTakenError] = useState<string | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifyPending, setVerifyPending] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);

  const strength = getPasswordStrength(password);
  const captchaCorrect = isMathCaptchaCorrect(captchaA, captchaB, captchaAnswer);
  const captchaStatus =
    captchaAnswer.trim().length === 0 ? "idle" : captchaCorrect ? "correct" : "incorrect";
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const usernameValid = USERNAME_PATTERN.test(username.trim());
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const usernameFormatError =
    username.trim().length > 0 && !usernameValid ? t("auth.username_rules") : null;
  const usernameError = usernameFormatError ?? usernameTakenError;
  const emailError = emailTakenError;

  const canSubmit =
    !pending &&
    !checkingUsername &&
    !checkingEmail &&
    fullName.trim().length > 0 &&
    usernameValid &&
    !usernameError &&
    emailValid &&
    !emailError &&
    password.length >= 8 &&
    passwordsMatch &&
    termsAccepted &&
    captchaCorrect;

  useEffect(() => {
    const value = username.trim();
    if (!value || !USERNAME_PATTERN.test(value)) {
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setCheckingUsername(true);
      void getAuthJson<{ usernameAvailable?: boolean }>(
        `/api/auth/availability?username=${encodeURIComponent(value)}`,
      ).then((result) => {
        if (cancelled) return;
        setCheckingUsername(false);
        if (result.error) {
          setUsernameTakenError(null);
          return;
        }
        setUsernameTakenError(
          result.data?.usernameAvailable === false ? t("auth.username_taken") : null,
        );
      });
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [username, t]);

  useEffect(() => {
    const value = email.trim().toLowerCase();
    if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setCheckingEmail(true);
      void getAuthJson<{ emailAvailable?: boolean }>(
        `/api/auth/availability?email=${encodeURIComponent(value)}`,
      ).then((result) => {
        if (cancelled) return;
        setCheckingEmail(false);
        if (result.error) {
          setEmailTakenError(null);
          return;
        }
        setEmailTakenError(result.data?.emailAvailable === false ? t("auth.email_taken") : null);
      });
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [email, t]);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = window.setTimeout(() => setResendSeconds((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendSeconds]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    setPending(true);
    setError(null);

    const result = await postAuthJson<{ email: string }>("/api/auth/register", {
      email: email.trim(),
      password,
      username: username.trim(),
      legalName: fullName.trim(),
      displayName: username.trim(),
      rememberMe: true,
    });

    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }

    if (typeof window !== "undefined") {
      if (referral.trim()) {
        window.sessionStorage.setItem(REFERRAL_STORAGE_KEY, referral.trim());
      }
      const intent = planIntent || planIntentFromUrl;
      if (intent) {
        window.sessionStorage.setItem(PLAN_INTENT_STORAGE_KEY, intent);
      }
      window.sessionStorage.setItem("usw_register_username", username.trim());
    }

    setVerifyEmail(result.data?.email ?? email.trim());
    setOtp("");
    setVerifyError(null);
    setResendSeconds(RESEND_COOLDOWN_SECONDS);
    setVerifyOpen(true);
    setPending(false);
  }

  async function verifyOtp() {
    if (!isValidOtp(otp)) {
      setVerifyError(t("auth.otp_invalid"));
      return;
    }

    setVerifyPending(true);
    setVerifyError(null);

    const result = await postAuthJson<{
      email: string;
      redirectTo?: "/admin" | "/dashboard";
      sessionCreated?: boolean;
      message?: string;
    }>("/api/auth/verify-email", {
      email: verifyEmail,
      token: sanitizeOtpInput(otp),
      rememberMe: true,
    });

    if (result.error) {
      setVerifyError(result.error);
      setVerifyPending(false);
      return;
    }

    setVerifyOpen(false);
    const redirectTo = result.data?.redirectTo === "/admin" ? "/admin" : "/dashboard";
    router.replace(appPath(redirectTo));
    router.refresh();
  }

  async function resendCode() {
    if (resendSeconds > 0 || verifyPending) return;
    setVerifyPending(true);
    setVerifyError(null);

    const result = await postAuthJson<{ accepted?: boolean }>("/api/auth/resend-verification", {
      email: verifyEmail,
    });

    setVerifyPending(false);
    if (result.error) {
      setVerifyError(result.error);
      return;
    }

    setResendSeconds(RESEND_COOLDOWN_SECONDS);
  }

  function changeEmail() {
    setVerifyOpen(false);
    setOtp("");
    setVerifyError(null);
  }

  const captchaMessage = useMemo(() => {
    if (captchaStatus === "correct") return t("auth.security_correct");
    if (captchaStatus === "incorrect") return t("auth.incorrect_security");
    return null;
  }, [captchaStatus, t]);

  return (
    <>
      <form onSubmit={submit} className="space-y-5" aria-busy={pending} noValidate>
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <AuthField label={t("auth.full_name")} htmlFor="fullName">
          <AuthInputIcon icon={<User className="h-4 w-4" aria-hidden />}>
            <Input
              id="fullName"
              name="fullName"
              placeholder="John Smith"
              autoComplete="name"
              required
              disabled={pending}
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
            />
          </AuthInputIcon>
        </AuthField>

        <AuthField
          label={t("auth.username")}
          htmlFor="username"
          error={usernameError}
          {...(checkingUsername ? { hint: t("auth.checking_availability") } : {})}
        >
          <AuthInputIcon icon={<UserCircle className="h-4 w-4" aria-hidden />}>
            <Input
              id="username"
              name="username"
              placeholder="johnsmith"
              autoComplete="username"
              required
              disabled={pending}
              value={username}
              aria-invalid={Boolean(usernameError)}
              onChange={(event) => setUsername(event.target.value)}
            />
          </AuthInputIcon>
        </AuthField>

        <AuthField
          label={t("auth.email")}
          htmlFor="email"
          error={emailError}
          {...(checkingEmail ? { hint: t("auth.checking_availability") } : {})}
        >
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
              aria-invalid={Boolean(emailError)}
              onChange={(event) => setEmail(event.target.value)}
            />
          </AuthInputIcon>
        </AuthField>

        <AuthField label={t("auth.password")} htmlFor="password">
          <AuthInputIcon icon={<Lock className="h-4 w-4" aria-hidden />}>
            <PasswordInput
              id="password"
              name="password"
              placeholder={t("auth.password")}
              autoComplete="new-password"
              minLength={8}
              required
              disabled={pending}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="pl-10"
            />
          </AuthInputIcon>
          {password ? (
            <div className="flex gap-1 pt-1" aria-label={`Password strength: ${strength.label}`}>
              {[1, 2, 3].map((level) => (
                <div
                  key={level}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors",
                    level <= strength.score ? strength.color : "bg-muted",
                  )}
                />
              ))}
            </div>
          ) : null}
        </AuthField>

        <AuthField
          label={t("auth.confirm_password")}
          htmlFor="confirmPassword"
          error={confirmPassword && !passwordsMatch ? t("auth.passwords_mismatch") : null}
        >
          <AuthInputIcon icon={<Lock className="h-4 w-4" aria-hidden />}>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              placeholder={t("auth.confirm_password")}
              autoComplete="new-password"
              minLength={8}
              required
              disabled={pending}
              value={confirmPassword}
              className="pl-10"
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </AuthInputIcon>
        </AuthField>

        <PlanSelectionField value={planIntent} onChange={setPlanIntent} disabled={pending} />

        <AuthField label={t("auth.referral_code")} htmlFor="referral">
          <AuthInputIcon icon={<Gift className="h-4 w-4" aria-hidden />}>
            <Input
              id="referral"
              name="referral"
              placeholder={t("auth.referral_optional")}
              autoComplete="off"
              disabled={pending}
              value={referral}
              onChange={(event) => setReferral(event.target.value)}
            />
          </AuthInputIcon>
        </AuthField>

        <AuthField
          label={t("auth.security_check")}
          htmlFor="securityAnswer"
          hint={t("auth.security_hint")}
        >
          <MathCaptchaField
            a={captchaA}
            b={captchaB}
            value={captchaAnswer}
            onChange={setCaptchaAnswer}
            disabled={pending}
            status={captchaStatus}
            statusMessage={captchaMessage}
          />
        </AuthField>

        <div className={cn("flex items-start gap-3", authCalloutClass)}>
          <Checkbox
            id="terms"
            checked={termsAccepted}
            onCheckedChange={(checked) => setTermsAccepted(checked === true)}
            disabled={pending}
            className={cn("mt-0.5", authCheckboxClass)}
          />
          <label htmlFor="terms" className="text-sm leading-relaxed text-foreground">
            {t("auth.terms_agree_prefix")}{" "}
            <Link href="/legal/terms" className={authLinkClass}>
              {t("auth.terms_of_service")}
            </Link>{" "}
            {t("auth.and")}{" "}
            <Link href="/legal/privacy" className={authLinkClass}>
              {t("auth.privacy_policy")}
            </Link>
            .
          </label>
        </div>

        <Button type="submit" className={authSubmitClass} disabled={!canSubmit}>
          {pending ? t("auth.creating_account") : t("auth.create_account_cta")}
        </Button>
      </form>

      <Dialog open={verifyOpen} onOpenChange={setVerifyOpen}>
        <DialogContent
          className="sm:max-w-md"
          onPointerDownOutside={(event) => event.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>{t("auth.verify_modal_title")}</DialogTitle>
            <DialogDescription>
              {t("auth.verify_modal_body")}
              <br />
              <span className="font-medium text-foreground">{verifyEmail}</span>
              <br />
              {t("auth.verify_modal_enter")}
              <br />
              {t("auth.verify_modal_link_hint")}
            </DialogDescription>
          </DialogHeader>

          <AuthField label={t("auth.verify_email")} htmlFor="otp">
            <Input
              id="otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={OTP_MAX_LENGTH}
              value={otp}
              disabled={verifyPending}
              onChange={(event) => setOtp(sanitizeOtpInput(event.target.value))}
              placeholder="Enter code from email"
            />
          </AuthField>

          {verifyError ? (
            <Alert variant="destructive">
              <AlertDescription>{verifyError}</AlertDescription>
            </Alert>
          ) : null}

          <DialogFooter className="gap-2 sm:flex-col">
            <Button
              type="button"
              className={authSubmitClass}
              disabled={verifyPending}
              onClick={() => void verifyOtp()}
            >
              {verifyPending ? t("auth.verifying") : t("auth.verify_cta")}
            </Button>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
              <Button
                type="button"
                variant="outline"
                disabled={verifyPending || resendSeconds > 0}
                onClick={() => void resendCode()}
              >
                {resendSeconds > 0
                  ? t("auth.resend_wait", { seconds: resendSeconds })
                  : t("auth.resend_code")}
              </Button>
              <Button type="button" variant="ghost" disabled={verifyPending} onClick={changeEmail}>
                {t("auth.change_email")}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function RegisterForm() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-muted" aria-hidden />}>
      <RegisterFormInner />
    </Suspense>
  );
}
