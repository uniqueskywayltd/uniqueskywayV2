import Link from "next/link";

import { APP_METADATA } from "@/config/constants";
import { cn } from "@/lib/utils";

export interface BrandMarkProps {
  compact?: boolean;
  className?: string;
}

export function BrandMark({ compact = false, className }: BrandMarkProps) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-3 text-foreground", className)}>
      <span
        className="flex size-9 items-center justify-center rounded-lg bg-brand text-sm font-semibold text-brand-foreground shadow-[var(--elevation-1)]"
        aria-hidden="true"
      >
        US
      </span>
      {!compact ? (
        <span className="grid leading-tight">
          <span className="text-sm font-semibold tracking-normal">{APP_METADATA.displayName}</span>
          <span className="text-xs text-muted-foreground">Investment platform</span>
        </span>
      ) : null}
    </Link>
  );
}
