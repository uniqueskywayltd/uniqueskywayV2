import { AuthLink, AuthShell, AuthTrustBar } from "@/features/auth/components/auth-shell";
import { RegisterForm } from "@/features/auth/components/register-form";

export default function RegisterPage() {
  return (
    <AuthShell
      title="Create your account"
      description=""
      panelTitle="Unique Sky Way"
      panelDescription="Start investing with a secure account protected by modern identity controls."
      panelImage="/brand/portfolio.webp"
      panelImageAlt="Start investing"
      footer={
        <>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account? <AuthLink href="/auth/login">Sign in</AuthLink>
          </p>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Have a code? <AuthLink href="/auth/verify-email">Verify email</AuthLink>
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
