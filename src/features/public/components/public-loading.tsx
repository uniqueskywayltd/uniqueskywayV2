import { Skeleton } from "@/components/ui";
import { PublicPageContainer } from "@/features/public/components/public-shell";

export function PublicPageSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading</span>
      <PublicPageContainer className="space-y-6 py-16">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-12 w-full max-w-xl" />
        <Skeleton className="h-4 w-full max-w-2xl" />
        <Skeleton className="h-4 w-full max-w-xl" />
        <div className="flex gap-3 pt-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </PublicPageContainer>
    </div>
  );
}
