import { AuthLink, AuthShell } from "@/features/auth/components/auth-shell";
import { VerifyEmailForm } from "@/features/auth/components/verify-email-form";

export default function VerifyEmailPage() {
  return (
    <AuthShell
      title="Verify email"
      description="Enter the verification code sent to your email address."
      footer={
        <>
          Back to <AuthLink href="/auth/login">sign in</AuthLink>.
        </>
      }
    >
      <VerifyEmailForm />
    </AuthShell>
  );
}
