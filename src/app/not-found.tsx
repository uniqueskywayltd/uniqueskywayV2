import Link from "next/link";

import { Button, EmptyState } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <EmptyState
        title="Page not found"
        description="This page does not exist or has moved."
        action={
          <Button asChild>
            <Link href="/account">Go to account</Link>
          </Button>
        }
      />
    </main>
  );
}
