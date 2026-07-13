"use client";

import { Button } from "@/components/ui";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <main className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
          <div className="w-full max-w-md space-y-4 rounded-lg border bg-card p-6">
            <h1 className="text-xl font-semibold">Application error</h1>
            <p className="text-sm text-muted-foreground">
              Unique Sky Way could not load correctly.
            </p>
            <Button type="button" onClick={() => reset()}>
              Reload
            </Button>
          </div>
        </main>
      </body>
    </html>
  );
}
