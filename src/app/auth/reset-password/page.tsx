import { AuthLink, AuthShell } from "@/features/auth/components/auth-shell";
import { ResetPasswordForm } from "@/features/auth/components/password-forms";

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Set new password"
      description="Use your reset code to set a new password."
      footer={
        <>
          Back to <AuthLink href="/auth/login">sign in</AuthLink>.
        </>
      }
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
