"use client";

import { Button } from "@/components/ui";
import { AdminErrorBlock } from "@/features/admin/components/admin-states";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="space-y-4">
      <AdminErrorBlock message={error.message || "Administrative page failed to render."} onRetry={reset} />
      <Button type="button" variant="outline" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
