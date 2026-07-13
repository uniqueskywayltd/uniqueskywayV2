import { AuthLink, AuthShell } from "@/features/auth/components/auth-shell";
import { LoginForm } from "@/features/auth/components/login-form";

export default function LoginPage() {
  return (
    <AuthShell
      title="Sign in"
      description="Access your Unique Sky Way account with Supabase-backed secure authentication."
      footer={
        <>
          Need an account? <AuthLink href="/auth/register">Create one</AuthLink>. Forgot your
          password? <AuthLink href="/auth/forgot-password">Reset it</AuthLink>.
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
