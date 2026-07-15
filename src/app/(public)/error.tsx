"use client";

import { Button } from "@/components/ui";
import { PublicPageContainer } from "@/features/public/components/public-shell";

export default function PublicError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PublicPageContainer className="py-20">
      <div className="mx-auto max-w-lg space-y-4 text-center">
        <h1 className="font-[family-name:var(--font-instrument-serif)] text-3xl text-foreground">
          Something went wrong
        </h1>
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t complete that request. Please try again.
        </p>
        <Button type="button" onClick={() => reset()}>
          Try again
        </Button>
      </div>
    </PublicPageContainer>
  );
}
