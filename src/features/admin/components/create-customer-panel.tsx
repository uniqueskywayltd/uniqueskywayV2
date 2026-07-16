"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert, AlertDescription, Button, Card, Input } from "@/components/ui";
import { PasswordInput } from "@/features/auth/components/password-input";

import { mutateAdminJson } from "../api-client";
import { AdminPageHeader } from "./admin-states";

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,24}$/;

export function CreateCustomerPanel() {
  const router = useRouter();
  const [legalName, setLegalName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const usernameValid = USERNAME_PATTERN.test(username.trim());
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const canSubmit =
    !busy &&
    legalName.trim().length > 0 &&
    usernameValid &&
    emailValid &&
    password.length >= 8 &&
    passwordsMatch;

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);

    const result = await mutateAdminJson<{
      user?: { id?: string };
      temporaryPassword?: string;
    }>("POST", "/api/admin/users", {
      email: email.trim().toLowerCase(),
      username: username.trim(),
      legalName: legalName.trim(),
      displayName: username.trim(),
      password,
      confirmPassword,
    });

    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }

    const id = result.data?.user?.id;
    if (id) {
      router.push(`/admin/customers/${id}`);
      return;
    }
    router.push("/admin/customers");
  }

  return (
    <div>
      <AdminPageHeader
        title="Create customer"
        description="Fill the same account details a customer would use at signup. A welcome email with the login password is sent, and first sign-in requires a password change."
        action={
          <Button asChild type="button" variant="outline">
            <Link href="/admin/customers">Back to customers</Link>
          </Button>
        }
      />

      <Card className="mx-auto max-w-xl space-y-4 p-6">
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">Full name</span>
          <Input
            value={legalName}
            onChange={(event) => setLegalName(event.target.value)}
            autoComplete="name"
            placeholder="Alex Morgan"
            required
          />
        </label>

        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">Username</span>
          <Input
            value={username}
            onChange={(event) => setUsername(event.target.value.trim())}
            autoComplete="username"
            placeholder="alexmorgan"
            required
          />
          {!usernameValid && username.length > 0 ? (
            <span className="text-xs text-destructive">
              3–24 characters: letters, numbers, underscore.
            </span>
          ) : null}
        </label>

        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">Email</span>
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value.trim().toLowerCase())}
            autoComplete="email"
            placeholder="customer@example.com"
            required
          />
        </label>

        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">Login password</span>
          <PasswordInput
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
          <span className="text-xs text-muted-foreground">
            Sent to the customer by email. They must change it on first sign-in.
          </span>
        </label>

        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">Confirm password</span>
          <PasswordInput
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
          {confirmPassword.length > 0 && !passwordsMatch ? (
            <span className="text-xs text-destructive">Passwords do not match.</span>
          ) : null}
        </label>

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-wrap gap-2 pt-2">
          <Button type="button" disabled={!canSubmit} onClick={() => void submit()}>
            {busy ? "Creating…" : "Create & email login details"}
          </Button>
          <Button asChild type="button" variant="outline">
            <Link href="/admin/customers">Cancel</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
