import { AuthLink, AuthShell } from "@/features/auth/components/auth-shell";
import { RegisterForm } from "@/features/auth/components/register-form";

export default function RegisterPage() {
  return (
    <AuthShell
      title="Create account"
      description="Start with identity verification only. Financial features are intentionally unavailable in this phase."
      footer={
        <>
          Already registered? <AuthLink href="/auth/login">Sign in</AuthLink>. Have a code?{" "}
          <AuthLink href="/auth/verify-email">Verify email</AuthLink>.
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
