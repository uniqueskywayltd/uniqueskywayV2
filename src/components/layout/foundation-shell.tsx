import { Button } from "@/components/ui/button";
import { APP_METADATA } from "@/config/constants";

export function FoundationShell() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-16">
        <p className="text-sm font-medium text-muted-foreground">{APP_METADATA.displayName}</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-normal sm:text-5xl">
          Engineering foundation
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
          Platform structure, configuration, shared contracts, health checks, and test rails are
          ready for the next implementation phase.
        </p>
        <div className="mt-8">
          <Button asChild variant="outline">
            <a href="/api/health">Health endpoint</a>
          </Button>
        </div>
      </section>
    </main>
  );
}
