import { AuthLink, AuthShell, AuthTrustBar } from "@/features/auth/components/auth-shell";
import { LoginForm } from "@/features/auth/components/login-form";

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to access your investor dashboard."
      panelTitle="Your portfolio, one secure login away"
      panelDescription="Track investments, monitor returns, and manage withdrawals from a single protected dashboard."
      panelImage="/brand/portfolio.webp"
      panelImageAlt="Investor portal"
      panelHighlights={[
        "Real-time portfolio visibility",
        "Secure withdrawal management",
        "Referral earnings tracking",
        "Dedicated investor support",
      ]}
      footer={
        <>
          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account? <AuthLink href="/auth/register">Create free account</AuthLink>
          </p>
          <div className="mt-5">
            <AuthTrustBar />
          </div>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
