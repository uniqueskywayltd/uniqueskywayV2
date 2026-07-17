import { AuthLink, AuthShell, AuthTrustBar } from "@/features/auth/components/auth-shell";
import { ChangePasswordForm } from "@/features/auth/components/password-forms";
import { getRequestLanguage } from "@/i18n/request-language";
import { createTranslator } from "@/i18n/translate";

export default async function ChangePasswordPage() {
  const { language } = await getRequestLanguage();
  const t = createTranslator(language);

  return (
    <AuthShell
      title={t("auth.change_password_title")}
      description={t("auth.change_password_description")}
      panelTitle={t("auth.panel_change_password_title")}
      panelDescription={t("auth.panel_change_password_description")}
      panelImage="/brand/security.webp"
      panelImageAlt={t("auth.panel.change_alt")}
      footer={
        <>
          <p className="text-center text-sm text-muted-foreground">
            {t("auth.back_sign_in")} <AuthLink href="/auth/login">{t("auth.sign_in_cta")}</AuthLink>
          </p>
          <div className="mt-5">
            <AuthTrustBar />
          </div>
        </>
      }
    >
      <ChangePasswordForm />
    </AuthShell>
  );
}
