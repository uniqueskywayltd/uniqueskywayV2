"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Gift, Lock, Mail, User, UserCircle } from "lucide-react";

import { Alert, AlertDescription, Button, Checkbox, Input } from "@/components/ui";
import { useI18n } from "@/features/i18n/i18n-provider";
import { cn } from "@/lib/utils";

import { postAuthJson } from "../api-client";
import { AuthField, AuthInputIcon, authCalloutClass, authCheckboxClass } from "./auth-field";
import {
  isMathCaptchaCorrect,
  MathCaptchaField,
  randomMathDigit,
} from "./math-captcha-field";
import { PasswordInput } from "./password-input";
import { PlanSelectionField } from "./plan-selection-field";
import { authLinkClass, authSubmitClass } from "./auth-shell";

const REFERRAL_STORAGE_KEY = "usw_referral_code";
const PLAN_INTENT_STORAGE_KEY = "usw_plan_intent";

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
  const searchParams = useSearchParams();
  const referralFromUrl = searchParams.get("referral") ?? searchParams.get("ref") ?? "";
  const planIntentFromUrl = searchParams.get("intent") ?? "";

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [mathA] = useState(() => randomMathDigit());
  const [mathB] = useState(() => randomMathDigit());
  const [mathAnswer, setMathAnswer] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [planIntent, setPlanIntent] = useState(planIntentFromUrl);
  const strength = getPasswordStrength(password);

  async function submit(formData: FormData) {
    setPending(true);
    setError(null);
    setMessage(null);

    if (!isMathCaptchaCorrect(mathA, mathB, mathAnswer)) {
      setError(t("auth.incorrect_security"));
      setPending(false);
      return;
    }

    if (!termsAccepted) {
      setError(t("auth.accept_terms"));
      setPending(false);
      return;
    }

    const fullName = String(formData.get("fullName") ?? "").trim();
    const username = String(formData.get("username") ?? "").trim();
    const confirmPassword = String(formData.get("confirmPassword") ?? "");
    const referral = String(formData.get("referral") ?? "").trim();

    if (!username || !/^[a-zA-Z0-9_]{3,24}$/.test(username)) {
      setError(t("auth.username_rules"));
      setPending(false);
      return;
    }

    if (password !== confirmPassword) {
      setError(t("auth.passwords_mismatch"));
      setPending(false);
      return;
    }

    const result = await postAuthJson<{ email: string }>("/api/auth/register", {
      email: String(formData.get("email") ?? ""),
      password,
      displayName: fullName || username,
      rememberMe: true,
    });

    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }

    if (typeof window !== "undefined") {
      if (referral) {
        window.sessionStorage.setItem(REFERRAL_STORAGE_KEY, referral);
      }
      const intent = planIntent || planIntentFromUrl;
      if (intent) {
        window.sessionStorage.setItem(PLAN_INTENT_STORAGE_KEY, intent);
      }
      window.sessionStorage.setItem("usw_register_username", username);
    }

    setMessage(
      t("auth.verify_queued", { email: result.data?.email ?? "your email" }),
    );
    setPending(false);
  }

  return (
    <form action={submit} className="space-y-5" aria-busy={pending}>
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
          />
        </AuthInputIcon>
      </AuthField>

      <AuthField label={t("auth.username")} htmlFor="username">
        <AuthInputIcon icon={<UserCircle className="h-4 w-4" aria-hidden />}>
          <Input
            id="username"
            name="username"
            placeholder="johnsmith"
            autoComplete="username"
            pattern="[a-zA-Z0-9_]{3,24}"
            title={t("auth.username_rules")}
            required
            disabled={pending}
          />
        </AuthInputIcon>
      </AuthField>

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

      <AuthField label={t("auth.confirm_password")} htmlFor="confirmPassword">
        <AuthInputIcon icon={<Lock className="h-4 w-4" aria-hidden />}>
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            placeholder={t("auth.confirm_password")}
            autoComplete="new-password"
            minLength={8}
            required
            disabled={pending}
            className="pl-10"
            onChange={(event) => {
              event.target.setCustomValidity(
                event.target.value !== password ? t("auth.passwords_mismatch") : "",
              );
            }}
          />
        </AuthInputIcon>
      </AuthField>

      <PlanSelectionField
        value={planIntent}
        onChange={setPlanIntent}
        disabled={pending}
      />

      <AuthField label={t("auth.referral_code")} htmlFor="referral">
        <AuthInputIcon icon={<Gift className="h-4 w-4" aria-hidden />}>
          <Input
            id="referral"
            name="referral"
            placeholder={t("auth.referral_optional")}
            defaultValue={referralFromUrl}
            autoComplete="off"
            disabled={pending}
          />
        </AuthInputIcon>
      </AuthField>

      <div className={authCalloutClass}>
        <MathCaptchaField
          a={mathA}
          b={mathB}
          value={mathAnswer}
          onChange={setMathAnswer}
          disabled={pending}
        />
      </div>

      <div className={cn("flex items-start gap-3", authCalloutClass)}>
        <Checkbox
          id="terms"
          checked={termsAccepted}
          onCheckedChange={(checked) => setTermsAccepted(checked === true)}
          required
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

      {message ? (
        <Alert>
          <AlertDescription>
            {message}{" "}
            <Link href="/auth/verify-email" className={authLinkClass}>
              {t("auth.verify_email")}
            </Link>
          </AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" className={authSubmitClass} disabled={pending}>
        {pending ? t("auth.creating_account") : t("auth.create_account_cta")}
      </Button>
    </form>
  );
}

export function RegisterForm() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-muted" aria-hidden />}>
      <RegisterFormInner />
    </Suspense>
  );
}
