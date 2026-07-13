import Link from "next/link";

import {
  LEGAL_BANNER,
  type LegalClassification,
  type LegalSection,
} from "@/features/public/content/legal-pages";
import { PublicPageContainer } from "@/features/public/components/public-shell";
import { FadeIn } from "@/features/public/components/motion";
import { cn } from "@/lib/utils";

const CLASSIFICATION_LABEL: Record<LegalClassification, string> = {
  fact: "Approved company fact / certified platform behavior",
  placeholder: "Placeholder — details pending lock",
  counsel: "Requires legal counsel review",
};

export function LegalCounselBanner() {
  return (
    <aside
      className="border-b border-amber-700/20 bg-amber-50/80"
      aria-label={LEGAL_BANNER.title}
    >
      <PublicPageContainer className="py-4">
        <p className="text-sm font-semibold text-foreground">{LEGAL_BANNER.title}</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{LEGAL_BANNER.body}</p>
      </PublicPageContainer>
    </aside>
  );
}

export function LegalPageHero({
  purpose,
  eyebrow,
  title,
  lead,
}: {
  purpose: string;
  eyebrow: string;
  title: string;
  lead: string;
}) {
  return (
    <header
      className="border-b border-border/70 bg-[radial-gradient(90%_80%_at_0%_0%,oklch(0.94_0.015_250)_0%,oklch(0.985_0.004_250)_55%)]"
      aria-label={purpose}
      data-purpose={purpose}
    >
      <PublicPageContainer className="py-14 sm:py-16">
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

export function LegalSectionBlock({ section }: { section: LegalSection }) {
  return (
    <section className="scroll-mt-24 py-8" id={slugify(section.title)}>
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-[family-name:var(--font-instrument-serif)] text-2xl tracking-normal text-foreground">
          {section.title}
        </h2>
        <span
          className={cn(
            "rounded-md border px-2 py-0.5 text-xs font-medium",
            section.classification === "fact" && "border-border text-muted-foreground",
            section.classification === "placeholder" &&
              "border-border bg-muted/60 text-muted-foreground",
            section.classification === "counsel" &&
              "border-amber-700/30 bg-amber-50 text-amber-950",
          )}
        >
          {CLASSIFICATION_LABEL[section.classification]}
        </span>
      </div>
      <div className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground sm:text-base">
        {section.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </section>
  );
}

export function LegalPageBody({ sections }: { sections: readonly LegalSection[] }) {
  return (
    <PublicPageContainer className="py-10 sm:py-12">
      <div className="mx-auto max-w-3xl divide-y divide-border/70">
        {sections.map((section) => (
          <LegalSectionBlock key={section.title} section={section} />
        ))}
      </div>
      <p className="mx-auto mt-10 max-w-3xl text-sm text-muted-foreground">
        Questions? Visit{" "}
        <Link href="/contact" className="underline underline-offset-4">
          Contact
        </Link>{" "}
        or read{" "}
        <Link href="/security" className="underline underline-offset-4">
          Security
        </Link>
        .
      </p>
    </PublicPageContainer>
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
