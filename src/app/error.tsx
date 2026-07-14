"use client";

import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui";

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-[50vh] flex-col items-center justify-center bg-background px-6 text-center">
      <AlertTriangle className="mb-4 h-8 w-8 text-destructive" aria-hidden />
      <h1 className="text-lg font-semibold">Something went wrong</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        The application could not complete this request.
      </p>
      <Button type="button" variant="outline" className="mt-6" onClick={() => reset()}>
        Reload
      </Button>
    </main>
  );
}
