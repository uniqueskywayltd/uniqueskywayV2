"use client";

import { AuthLink, AuthShell, AuthTrustBar } from "@/features/auth/components/auth-shell";
import { LoginForm } from "@/features/auth/components/login-form";
import {
  ChangePasswordForm,
  ForgotPasswordForm,
  ResetPasswordForm,
} from "@/features/auth/components/password-forms";
import { RegisterForm } from "@/features/auth/components/register-form";
import { VerifyEmailForm } from "@/features/auth/components/verify-email-form";
import { useI18n } from "@/features/i18n/i18n-provider";

export function LoginPageView() {
  const { t } = useI18n();

  return (
    <AuthShell
      title={t("auth.welcome_back")}
      description={t("auth.welcome_subtitle")}
      panelHighlights={[
        t("auth.highlight.portfolio"),
        t("auth.highlight.withdrawals"),
        t("auth.highlight.referrals"),
        t("auth.highlight.support"),
      ]}
      footer={
        <>
          <p className="text-center text-sm text-muted-foreground">
            {t("auth.dont_have")} <AuthLink href="/auth/register">{t("auth.create_free")}</AuthLink>
          </p>
          <div className="mt-5">
            <AuthTrustBar />
          </div>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}

export function RegisterPageView() {
  const { t } = useI18n();

  return (
    <AuthShell
      title={t("auth.create_title")}
      description=""
      panelTitle={t("auth.panel.register_title")}
      panelDescription=""
      panelImageAlt={t("auth.panel.register_alt")}
      footer={
        <>
          <p className="text-center text-sm text-muted-foreground">
            {t("auth.already_have")} <AuthLink href="/auth/login">{t("auth.sign_in_cta")}</AuthLink>
          </p>
          <div className="mt-5">
            <AuthTrustBar />
          </div>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}

export function VerifyEmailPageView() {
  const { t } = useI18n();

  return (
    <AuthShell
      title={t("auth.verify_email")}
      description={t("auth.verify_modal_enter")}
      panelImageAlt={t("auth.panel.verify_alt")}
    >
      <VerifyEmailForm />
    </AuthShell>
  );
}

export function ForgotPasswordPageView() {
  const { t } = useI18n();

  return (
    <AuthShell
      title={t("auth.forgot_title")}
      description={t("auth.forgot_modal_body")}
      panelTitle={t("auth.panel.recovery_title")}
      panelImageAlt={t("auth.panel.recovery_alt")}
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}

export function ResetPasswordPageView() {
  const { t } = useI18n();

  return (
    <AuthShell
      title={t("auth.reset_title")}
      description={t("auth.reset_modal_body")}
      panelImageAlt={t("auth.panel.reset_alt")}
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}

export function ChangePasswordPageView() {
  const { t } = useI18n();

  return (
    <AuthShell
      title={t("auth.reset_title")}
      description={t("auth.reset_modal_body")}
      panelImageAlt={t("auth.panel.change_alt")}
    >
      <ChangePasswordForm />
    </AuthShell>
  );
}
