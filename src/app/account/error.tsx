"use client";

import { Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";

export default function AccountError({ reset }: { error: Error; reset: () => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Something went wrong</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">The account area could not be loaded.</p>
        <Button type="button" onClick={() => reset()}>
          Try again
        </Button>
      </CardContent>
    </Card>
  );
}
