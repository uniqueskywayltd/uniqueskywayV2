import { AuthLink, AuthShell, AuthTrustBar } from "@/features/auth/components/auth-shell";
import { ForgotPasswordForm } from "@/features/auth/components/password-forms";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Forgot password?"
      description="Enter your email and we'll send you a secure reset code."
      panelTitle="Account recovery"
      panelDescription="For your security, reset codes expire after a short period."
      panelImage="/brand/security.webp"
      panelImageAlt="Password recovery"
      footer={
        <>
          <p className="text-center text-sm text-muted-foreground">
            <AuthLink href="/auth/login">Back to sign in</AuthLink>
            {" · "}
            <AuthLink href="/auth/reset-password">Enter a code</AuthLink>
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
