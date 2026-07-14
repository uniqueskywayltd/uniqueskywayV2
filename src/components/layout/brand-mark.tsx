import Image from "next/image";
import Link from "next/link";

import { brandAssets, type BrandLogoSurface } from "@/features/brand";
import { cn } from "@/lib/utils";

export interface BrandMarkProps {
  compact?: boolean;
  /** Prefer onLight for light UI shells; onDark for navy/dark chrome. */
  surface?: BrandLogoSurface | "icon";
  className?: string;
}

export function BrandMark({ compact = false, surface = "onLight", className }: BrandMarkProps) {
  if (surface === "icon" || compact) {
    return (
      <Link href="/" className={cn("inline-flex items-center gap-3 text-foreground", className)} aria-label="Unique Sky Way">
        <Image
          src={brandAssets.icon}
          alt=""
          width={36}
          height={36}
          className="size-9 rounded-lg object-cover shadow-[var(--elevation-1)]"
          priority
        />
        {!compact ? (
          <span className="grid leading-tight">
            <span className="text-sm font-semibold tracking-normal">Unique Sky Way</span>
            <span className="text-xs text-muted-foreground">Investment platform</span>
          </span>
        ) : null}
      </Link>
    );
  }

  const src = brandAssets.logos[surface];

  return (
    <Link href="/" className={cn("inline-flex items-center", className)} aria-label="Unique Sky Way">
      <Image
        src={src}
        alt="Unique Sky Way"
        width={surface === "onDark" ? 180 : 160}
        height={surface === "onDark" ? 60 : 54}
        className="h-10 w-auto max-w-[180px] object-contain"
        priority
      />
    </Link>
  );
}
