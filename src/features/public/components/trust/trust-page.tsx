import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

import { FadeIn } from "@/features/public/components/motion";
import {
  marketingOutlineBtn,
  marketingPrimaryBtn,
  section,
} from "@/features/public/components/marketing-ui";
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
        <Image src={image} alt={imageAlt} fill priority className="object-cover" sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/92 via-slate-950/75 to-slate-950/50" />
      </div>

      <PublicPageContainer
        className={cn("py-20 sm:py-24 lg:py-28", align === "center" && "text-center")}
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
    <section className={cn(section.padding, className)}>
      <PublicPageContainer>
        <h2 className={section.heading}>{title}</h2>
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
    <section className={cn("relative overflow-hidden", section.padding)} aria-label={title}>
      <div className="absolute inset-0 -z-10 bg-primary" />
      <PublicPageContainer>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-primary-foreground sm:text-4xl">
            {title}
          </h2>
          <p className="mt-3 text-sm leading-7 text-primary-foreground/75 sm:text-base">{support}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href={primary.href}
              className={cn(
                marketingPrimaryBtn(),
                "bg-white text-primary hover:bg-white/90 hover:text-primary",
              )}
            >
              {primary.label}
            </Link>
            <Link
              href={secondary.href}
              className={cn(
                marketingOutlineBtn(),
                "border-white/25 text-white hover:bg-white/10 hover:text-white",
              )}
            >
              {secondary.label}
            </Link>
          </div>
        </div>
      </PublicPageContainer>
    </section>
  );
}
