import { Card, CardContent, CardHeader, Skeleton } from "@/components/ui";

export function CustomerPageSkeleton() {
  return (
    <div className="space-y-5" role="status" aria-label="Loading account area">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {[0, 1, 2, 3].map((item) => (
          <Card key={item}>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
      <span className="sr-only">Loading account area</span>
    </div>
  );
}
