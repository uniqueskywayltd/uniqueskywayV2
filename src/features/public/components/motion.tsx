import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Approved motion primitives (Wave A §20).
 * Decorative marketing animations belong in later sprints.
 */
export function FadeIn({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "motion-safe:animate-in motion-safe:fade-in motion-safe:duration-[var(--duration-standard)] motion-reduce:animate-none",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function marketingTransitionClassName(kind: "fast" | "standard" | "slow" = "standard") {
  const duration =
    kind === "fast"
      ? "duration-[var(--duration-fast)]"
      : kind === "slow"
        ? "duration-[var(--duration-slow)]"
        : "duration-[var(--duration-standard)]";
  return cn(
    "transition-colors motion-safe:transition-[color,border-color,background-color,box-shadow,opacity,transform]",
    duration,
    "ease-[var(--ease-standard)]",
    "motion-reduce:transition-none",
  );
}
