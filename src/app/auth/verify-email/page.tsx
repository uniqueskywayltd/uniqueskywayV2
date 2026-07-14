import { AuthLink, AuthShell, AuthTrustBar } from "@/features/auth/components/auth-shell";
import { VerifyEmailForm } from "@/features/auth/components/verify-email-form";

export default function VerifyEmailPage() {
  return (
    <AuthShell
      title="Verify email"
      description="Enter the verification code sent to your email address."
      panelTitle="Confirm your identity"
      panelDescription="Email verification keeps your Unique Sky Way account protected."
      panelImage="/brand/trust.webp"
      panelImageAlt="Email verification"
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
      <VerifyEmailForm />
    </AuthShell>
  );
}
