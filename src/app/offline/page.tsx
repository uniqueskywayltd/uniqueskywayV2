import { WifiOff } from "lucide-react";

import { BrandMark } from "@/components/layout/brand-mark";

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center text-foreground">
      <BrandMark surface="theme" width={140} className="mb-8 [&_img]:max-h-9" />
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-muted/50">
        <WifiOff className="h-7 w-7 text-muted-foreground" aria-hidden />
      </div>
      <h1 className="mt-6 text-2xl font-semibold text-foreground">You are offline</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        Reconnect to continue using your Unique Sky Way account.
      </p>
    </main>
  );
}
