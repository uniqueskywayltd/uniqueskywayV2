import { AuthLink, AuthShell, AuthTrustBar } from "@/features/auth/components/auth-shell";
import { ResetPasswordForm } from "@/features/auth/components/password-forms";

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Set new password"
      description="Use your reset code to choose a new password."
      panelTitle="Secure password reset"
      panelDescription="Choose a strong password to protect your investor account."
      panelImage="/brand/security.webp"
      panelImageAlt="Password reset"
      footer={
        <>
          <p className="text-center text-sm text-muted-foreground">
            Back to <AuthLink href="/auth/login">sign in</AuthLink>
          </p>
          <div className="mt-5">
            <AuthTrustBar />
          </div>
        </>
      }
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
