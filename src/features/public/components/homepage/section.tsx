import type { ReactNode } from "react";

import { PublicPageContainer } from "@/features/public/components/public-shell";
import { cn } from "@/lib/utils";

export function HomeSection({
  id,
  purpose,
  children,
  className,
  containerClassName,
  tone = "default",
}: {
  id: string;
  purpose: string;
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  tone?: "default" | "muted" | "ink";
}) {
  return (
    <section
      id={id}
      aria-label={purpose}
      data-purpose={purpose}
      className={cn(
        "py-16 sm:py-20 lg:py-24",
        tone === "muted" && "bg-muted/40",
        tone === "ink" && "bg-[oklch(0.18_0.02_252)] text-[oklch(0.985_0_0)]",
        className,
      )}
    >
      <PublicPageContainer {...(containerClassName ? { className: containerClassName } : {})}>
        {children}
      </PublicPageContainer>
    </section>
  );
}

export function SectionHeading({
  title,
  lead,
  ink = false,
}: {
  title: string;
  lead?: string;
  ink?: boolean;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <h2
        className={cn(
          "font-[family-name:var(--font-instrument-serif)] text-3xl tracking-normal sm:text-4xl",
          ink ? "text-[oklch(0.985_0_0)]" : "text-foreground",
        )}
      >
        {title}
      </h2>
      {lead ? (
        <p
          className={cn(
            "mt-4 text-base leading-7 sm:text-lg",
            ink ? "text-[oklch(0.9_0.01_250)]" : "text-muted-foreground",
          )}
        >
          {lead}
        </p>
      ) : null}
    </div>
  );
}
