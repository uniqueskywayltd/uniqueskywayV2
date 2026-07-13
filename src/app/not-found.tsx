import Link from "next/link";

import { Button, EmptyState } from "@/components/ui";

export default function NotFound() {
  return (
    <main id="main-content" className="flex min-h-screen items-center justify-center bg-background p-6">
      <EmptyState
        title="Page not found"
        description="We couldn’t find that page."
        action={
          <Button asChild>
            <Link href="/">Go to home</Link>
          </Button>
        }
      />
    </main>
  );
}
