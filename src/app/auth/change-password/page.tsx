import { AuthLink, AuthShell, AuthTrustBar } from "@/features/auth/components/auth-shell";
import { ChangePasswordForm } from "@/features/auth/components/password-forms";

export default function ChangePasswordPage() {
  return (
    <AuthShell
      title="Choose a new password"
      description="Your account requires a password update before you continue."
      panelTitle="Secure your account"
      panelDescription="Set a password only you know. You will use it for future sign-ins."
      panelImage="/brand/security.webp"
      panelImageAlt="Password change"
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
      <ChangePasswordForm />
    </AuthShell>
  );
}
