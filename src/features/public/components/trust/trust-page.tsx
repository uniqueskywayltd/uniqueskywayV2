import type { ReactNode } from "react";
import Image from "next/image";
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
  image = "/brand/global-markets.webp",
  imageAlt = "Unique Sky Way",
  align = "left",
}: {
  eyebrow: string;
  title: string;
  lead: string;
  purpose: string;
  image?: string;
  imageAlt?: string;
  align?: "left" | "center";
}) {
  return (
    <header className="relative overflow-hidden" aria-label={purpose} data-purpose={purpose}>
      <div className="absolute inset-0 -z-10">
        <Image
          src={image}
          alt={imageAlt}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/92 via-slate-950/75 to-slate-950/50" />
      </div>

      <PublicPageContainer
        className={cn(
          "py-20 sm:py-24 lg:py-28",
          align === "center" && "text-center",
        )}
      >
        <FadeIn className={cn("max-w-3xl", align === "center" && "mx-auto")}>
          <p className="text-xs font-medium tracking-[0.14em] text-slate-300 uppercase">{eyebrow}</p>
          <h1
            className={cn(
              "mt-3 max-w-3xl text-3xl font-semibold leading-[1.12] tracking-tight text-white sm:text-4xl lg:text-5xl",
              align === "center" && "mx-auto",
            )}
          >
            {title}
          </h1>
          <p
            className={cn(
              "mt-5 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg",
              align === "center" && "mx-auto",
            )}
          >
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
