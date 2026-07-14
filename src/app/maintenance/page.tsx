import Link from "next/link";
import { Wrench } from "lucide-react";

import { Button } from "@/components/ui";

export default function MaintenancePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
        <Wrench className="h-7 w-7 text-primary" aria-hidden />
      </div>
      <h1 className="mt-6 text-2xl font-semibold">Under maintenance</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        Unique Sky Way is currently undergoing scheduled maintenance. Please check back shortly.
      </p>
      <Button asChild variant="outline" className="mt-8">
        <Link href="/auth/login">Sign in</Link>
      </Button>
    </main>
  );
}
