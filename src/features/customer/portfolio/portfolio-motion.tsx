import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Portfolio-only motion — respects prefers-reduced-motion. */
export function PortfolioReveal({
  children,
  className,
  delayMs = 0,
}: {
  children: ReactNode;
  className?: string;
  delayMs?: number;
}) {
  return (
    <div
      className={cn(
        "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-500 motion-reduce:animate-none",
        className,
      )}
      style={delayMs > 0 ? { animationDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </div>
  );
}
