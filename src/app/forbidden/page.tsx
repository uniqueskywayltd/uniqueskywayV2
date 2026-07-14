import Link from "next/link";
import { ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui";

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
        <ShieldAlert className="h-7 w-7 text-destructive" aria-hidden />
      </div>
      <h1 className="mt-6 text-2xl font-semibold">Access restricted</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        This area is not available to your account.
      </p>
      <Button asChild className="mt-8">
        <Link href="/account">Return to account</Link>
      </Button>
    </main>
  );
}
