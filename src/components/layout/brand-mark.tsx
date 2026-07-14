import Image from "next/image";
import Link from "next/link";

import { brandAssets, type BrandLogoSurface } from "@/features/brand";
import { cn } from "@/lib/utils";

const LOGO_SIZES = {
  onLight: { width: 840, height: 297 },
  onDark: { width: 360, height: 121 },
} as const;

export interface BrandMarkProps {
  /** Icon-only compact mark (`icon.webp`). */
  compact?: boolean;
  /**
   * `theme` — light/dark swap via CSS (`light-logo.webp` / `dark-logo.webp`).
   * `onLight` — fixed dark-colored mark for light backgrounds.
   * `onDark` — fixed light-colored mark for dark backgrounds (e.g. slate footer).
   * `icon` — compact brand icon.
   */
  surface?: BrandLogoSurface | "theme" | "icon";
  className?: string;
  width?: number;
  priority?: boolean;
}

function scaledHeight(
  targetWidth: number,
  source: (typeof LOGO_SIZES)[keyof typeof LOGO_SIZES],
) {
  return Math.round((targetWidth * source.height) / source.width);
}

const logoImageClass = "h-auto max-h-10 w-auto max-w-full object-contain sm:max-h-11";

/**
 * Authoritative brand mark — assets from `public/brand/` via `brandAssets`.
 * Theme variant swaps instantly with the `dark` class (no hydration flash).
 */
export function BrandMark({
  compact = false,
  surface = "theme",
  className,
  width = 160,
  priority = true,
}: BrandMarkProps) {
  if (surface === "icon" || compact) {
    return (
      <Link
        href="/"
        className={cn("inline-flex items-center gap-3 text-foreground", className)}
        aria-label="Unique Sky Way"
      >
        <Image
          src={brandAssets.icon}
          alt=""
          width={36}
          height={36}
          className="size-9 rounded-lg object-cover shadow-[var(--elevation-1)]"
          priority={priority}
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

  if (surface === "onLight") {
    return (
      <Link href="/" className={cn("inline-flex items-center", className)} aria-label="Unique Sky Way">
        <Image
          src={brandAssets.logos.onLight}
          alt="Unique Sky Way"
          width={width}
          height={scaledHeight(width, LOGO_SIZES.onLight)}
          className={logoImageClass}
          priority={priority}
        />
      </Link>
    );
  }

  if (surface === "onDark") {
    return (
      <Link href="/" className={cn("inline-flex items-center", className)} aria-label="Unique Sky Way">
        <Image
          src={brandAssets.logos.onDark}
          alt="Unique Sky Way"
          width={width}
          height={scaledHeight(width, LOGO_SIZES.onDark)}
          className={logoImageClass}
          priority={priority}
        />
      </Link>
    );
  }

  return (
    <Link href="/" className={cn("inline-flex items-center", className)} aria-label="Unique Sky Way">
      <Image
        src={brandAssets.logos.onLight}
        alt="Unique Sky Way"
        width={width}
        height={scaledHeight(width, LOGO_SIZES.onLight)}
        className={cn(logoImageClass, "dark:hidden")}
        priority={priority}
      />
      <Image
        src={brandAssets.logos.onDark}
        alt="Unique Sky Way"
        width={width}
        height={scaledHeight(width, LOGO_SIZES.onDark)}
        className={cn(logoImageClass, "hidden dark:block")}
        priority={priority}
      />
    </Link>
  );
}
