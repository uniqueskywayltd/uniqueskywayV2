import type { ReactNode } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface ChartFrameProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function ChartFrame({ title, description, children, className }: ChartFrameProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>
        <div className={cn("min-h-56 rounded-md border bg-muted/20 p-4")}>{children}</div>
      </CardContent>
    </Card>
  );
}
