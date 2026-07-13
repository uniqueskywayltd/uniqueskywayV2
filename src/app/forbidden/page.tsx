import Link from "next/link";

import { Button, EmptyState } from "@/components/ui";

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <EmptyState
        title="Access restricted"
        description="This area is not available to your account."
        action={
          <Button asChild>
            <Link href="/account">Return to account</Link>
          </Button>
        }
      />
    </main>
  );
}
