import { AuthLink, AuthShell, AuthTrustBar } from "@/features/auth/components/auth-shell";
import { ForgotPasswordForm } from "@/features/auth/components/password-forms";
import { getRequestLanguage } from "@/i18n/request-language";
import { createTranslator } from "@/i18n/translate";

export default async function ForgotPasswordPage() {
  const { language } = await getRequestLanguage();
  const t = createTranslator(language);

  return (
    <AuthShell
      title={t("auth.forgot_title")}
      description={t("auth.forgot_page_description")}
      panelTitle={t("auth.panel.recovery_title")}
      panelDescription={t("auth.panel_forgot_description")}
      panelImage="/brand/security.webp"
      panelImageAlt={t("auth.panel.recovery_alt")}
      footer={
        <>
          <p className="text-center text-sm text-muted-foreground">
            <AuthLink href="/auth/login">{t("auth.back_sign_in")}</AuthLink>
            {" · "}
            <AuthLink href="/auth/reset-password">{t("auth.enter_reset_code")}</AuthLink>
          </p>
          <div className="mt-5">
            <AuthTrustBar />
          </div>
        </>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
