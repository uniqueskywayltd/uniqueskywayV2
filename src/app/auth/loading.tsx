import { BrandMark } from "@/components/layout/brand-mark";
import { Skeleton } from "@/components/ui";

export default function AuthLoading() {
  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[1.05fr_1fr]">
      <div className="relative hidden border-r border-border/50 bg-muted/35 lg:block" />
      <div className="flex flex-col">
        <div className="flex items-center justify-between border-b border-border/50 px-6 py-5 lg:px-10">
          <div className="lg:hidden">
            <BrandMark surface="theme" width={112} className="[&_img]:max-h-8" />
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center px-6 py-10">
          <div className="w-full max-w-[440px] overflow-hidden rounded-2xl border border-border bg-card p-8 shadow-lg sm:p-9">
            <div className="mb-8 space-y-3">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-72 max-w-full" />
            </div>
            <div className="space-y-5">
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-full" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
