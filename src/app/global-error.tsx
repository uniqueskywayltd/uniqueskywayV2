"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <main className="flex min-h-dvh items-center justify-center p-6">
          <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card p-8 text-center shadow-sm">
            <h1 className="text-lg font-semibold">Something went wrong</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We couldn&apos;t load this page. Please try again or return to the homepage.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                onClick={() => reset()}
              >
                Try again
              </button>
              <button
                type="button"
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium"
                onClick={() => {
                  window.location.href = "/";
                }}
              >
                Go home
              </button>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
