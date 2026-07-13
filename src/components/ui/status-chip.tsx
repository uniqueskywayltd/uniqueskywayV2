import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";

export type StatusTone = "active" | "pending" | "matured" | "restricted" | "neutral";

const statusToneClassName: Record<StatusTone, string> = {
  active: "border-status-active/20 bg-status-active/10 text-status-active",
  pending: "border-status-pending/25 bg-status-pending/15 text-warning-foreground",
  matured: "border-status-matured/20 bg-status-matured/10 text-status-matured",
  restricted: "border-status-restricted/20 bg-status-restricted/10 text-status-restricted",
  neutral: "border-border bg-muted text-muted-foreground",
};

export interface StatusChipProps {
  tone: StatusTone;
  children: ReactNode;
}

export function StatusChip({ tone, children }: StatusChipProps) {
  return (
    <Badge variant="outline" className={statusToneClassName[tone]}>
      <span className="mr-1.5 size-1.5 rounded-full bg-current" aria-hidden="true" />
      {children}
    </Badge>
  );
}
