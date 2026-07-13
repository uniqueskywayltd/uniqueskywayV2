import type { ReactNode } from "react";
import Link from "next/link";

import { Button } from "@/components/ui";
import { FadeIn } from "@/features/public/components/motion";
import { PublicPageContainer } from "@/features/public/components/public-shell";
import { cn } from "@/lib/utils";

export function TrustPageHero({
  eyebrow,
  title,
  lead,
  purpose,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  purpose: string;
}) {
  return (
    <header
      className="border-b border-border/70 bg-[radial-gradient(90%_80%_at_0%_0%,oklch(0.94_0.015_250)_0%,oklch(0.985_0.004_250)_55%)]"
      aria-label={purpose}
      data-purpose={purpose}
    >
      <PublicPageContainer className="py-16 sm:py-20">
        <FadeIn className="max-w-3xl">
          <p className="text-sm font-medium tracking-[0.16em] text-muted-foreground uppercase">
            {eyebrow}
          </p>
          <h1 className="mt-4 font-[family-name:var(--font-instrument-serif)] text-4xl tracking-normal text-foreground sm:text-5xl">
            {title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            {lead}
          </p>
        </FadeIn>
      </PublicPageContainer>
    </header>
  );
}

export function TrustSection({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("py-12 sm:py-14", className)}>
      <PublicPageContainer>
        <h2 className="font-[family-name:var(--font-instrument-serif)] text-2xl tracking-normal text-foreground sm:text-3xl">
          {title}
        </h2>
        <div className="mt-6 space-y-4 text-sm leading-7 text-muted-foreground sm:text-base">
          {children}
        </div>
      </PublicPageContainer>
    </section>
  );
}

export function TrustCtaBand({
  title,
  support,
  primary,
  secondary,
}: {
  title: string;
  support: string;
  primary: { label: string; href: string };
  secondary: { label: string; href: string };
}) {
  return (
    <section className="border-t bg-muted/30 py-14">
      <PublicPageContainer>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-[family-name:var(--font-instrument-serif)] text-2xl text-foreground sm:text-3xl">
            {title}
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">{support}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href={primary.href}>{primary.label}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={secondary.href}>{secondary.label}</Link>
            </Button>
          </div>
        </div>
      </PublicPageContainer>
    </section>
  );
}
