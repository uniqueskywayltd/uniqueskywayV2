import { AuthLink, AuthShell } from "@/features/auth/components/auth-shell";
import { ForgotPasswordForm } from "@/features/auth/components/password-forms";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset password"
      description="Request a password reset code for your account email."
      footer={
        <>
          Already have a code? <AuthLink href="/auth/reset-password">Enter it</AuthLink>.
        </>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
