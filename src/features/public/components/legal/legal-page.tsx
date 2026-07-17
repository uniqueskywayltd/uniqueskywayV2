import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Cookie,
  FileText,
  Info,
  Lock,
  Scale,
  Shield,
  Users,
  Wallet,
} from "lucide-react";

import {
  LEGAL_BANNER,
  type LegalClassification,
  type LegalSection,
} from "@/features/public/content/legal-pages";
import { PublicPageContainer } from "@/features/public/components/public-shell";
import { FadeIn } from "@/features/public/components/motion";
import { cn } from "@/lib/utils";

import { slugifyLegalHeading } from "./legal-utils";

const CALLOUT_COPY: Record<
  LegalClassification,
  { label: string; tone: "info" | "notice" | "neutral" }
> = {
  fact: { label: "", tone: "neutral" },
  placeholder: { label: "Information pending final publication", tone: "info" },
  counsel: { label: "Important notice — subject to legal counsel review", tone: "notice" },
};

const SECTION_ICONS: Record<string, LucideIcon> = {
  "information-we-may-collect": FileText,
  "how-we-use-information": Users,
  sharing: Users,
  retention: FileText,
  "your-rights": Scale,
  "contact-for-privacy-questions": Info,
  "essential-cookies": Cookie,
  "analytics-and-marketing": Cookie,
  investments: AlertTriangle,
  "deposits-and-withdrawals": Wallet,
  "liability-and-disputes": Scale,
  "no-guarantee-of-returns": AlertTriangle,
  "market-and-strategy-risk": AlertTriangle,
  "operational-and-process-risk": Shield,
  accounts: Lock,
};

export function LegalCounselBanner() {
  return (
    <aside
      className="border-b border-amber-500/25 bg-amber-500/8 dark:bg-amber-500/10"
      aria-label={LEGAL_BANNER.title}
    >
      <PublicPageContainer className="py-4">
        <p className="text-sm font-semibold text-foreground">{LEGAL_BANNER.title}</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{LEGAL_BANNER.body}</p>
        <p className="sr-only">Requires legal counsel review</p>
      </PublicPageContainer>
    </aside>
  );
}

export function LegalPremiumHero({
  purpose,
  eyebrow,
  title,
  lead,
  lastUpdated,
  readingMinutes,
}: {
  purpose: string;
  eyebrow: string;
  title: string;
  lead: string;
  lastUpdated: string;
  readingMinutes: number;
}) {
  return (
    <header
      className="relative overflow-hidden border-b border-border/70 bg-gradient-to-br from-primary/10 via-background to-background"
      aria-label={purpose}
      data-purpose={purpose}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_100%_0%,var(--primary)/0.12,transparent_60%)]"
        aria-hidden
      />
      <PublicPageContainer className="relative py-14 sm:py-16 lg:py-20">
        <FadeIn className="mx-auto max-w-3xl text-center lg:text-left">
          <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
            {eyebrow}
          </p>
          <h1 className="mt-4 font-heading text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            {title}
          </h1>
          <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg">{lead}</p>
          <dl className="mt-8 flex flex-wrap justify-center gap-6 text-sm lg:justify-start">
            <div>
              <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Last Updated
              </dt>
              <dd className="mt-1 font-medium text-foreground">{lastUpdated}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Reading Time
              </dt>
              <dd className="mt-1 font-medium text-foreground">
                {readingMinutes} {readingMinutes === 1 ? "minute" : "minutes"}
              </dd>
            </div>
          </dl>
        </FadeIn>
      </PublicPageContainer>
    </header>
  );
}

export function LegalSectionCard({
  section,
  index,
  numbered = false,
  emphasize = false,
}: {
  section: LegalSection;
  index: number;
  numbered?: boolean;
  emphasize?: boolean;
}) {
  const id = slugifyLegalHeading(section.title);
  const Icon = SECTION_ICONS[id] ?? FileText;
  const callout = CALLOUT_COPY[section.classification];

  return (
    <section
      id={id}
      className="scroll-mt-28 rounded-2xl border border-border/70 bg-card p-6 shadow-sm sm:p-7"
      aria-labelledby={`${id}-heading`}
    >
      <div className="flex gap-4">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl",
            emphasize
              ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
              : "bg-primary/10 text-primary",
          )}
          aria-hidden
        >
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2
            id={`${id}-heading`}
            className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
          >
            {numbered ? (
              <span className="mr-2 text-muted-foreground tabular-nums">{index + 1}.</span>
            ) : null}
            {section.title}
          </h2>

          {callout.label ? (
            <div
              className={cn(
                "mt-4 flex gap-2 rounded-xl border px-4 py-3 text-sm leading-relaxed",
                callout.tone === "notice" &&
                  "border-amber-500/30 bg-amber-500/8 text-foreground dark:bg-amber-500/10",
                callout.tone === "info" &&
                  "border-sky-500/25 bg-sky-500/8 text-foreground dark:bg-sky-500/10",
              )}
              role="note"
            >
              {callout.tone === "notice" ? (
                <AlertTriangle
                  className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400"
                  aria-hidden
                />
              ) : (
                <Info
                  className="mt-0.5 size-4 shrink-0 text-sky-600 dark:text-sky-400"
                  aria-hidden
                />
              )}
              <p>{callout.label}</p>
            </div>
          ) : null}

          <div className="mt-4 space-y-4 text-base leading-7 text-muted-foreground">
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const PRIVACY_EMPHASIS = new Set([
  "information-we-may-collect",
  "how-we-use-information",
  "essential-cookies",
  "analytics-and-marketing",
  "your-rights",
  "contact-for-privacy-questions",
]);

const TERMS_EMPHASIS = new Set([
  "investments",
  "deposits-and-withdrawals",
  "liability-and-disputes",
]);

export function LegalSectionsBody({
  sections,
  numbered = false,
  pageKey,
}: {
  sections: readonly LegalSection[];
  numbered?: boolean;
  pageKey?: "privacy" | "terms";
}) {
  return (
    <>
      {sections.map((section, index) => {
        const id = slugifyLegalHeading(section.title);
        const emphasize =
          pageKey === "privacy"
            ? PRIVACY_EMPHASIS.has(id)
            : pageKey === "terms"
              ? TERMS_EMPHASIS.has(id)
              : false;
        return (
          <LegalSectionCard
            key={section.title}
            section={section}
            index={index}
            numbered={numbered}
            emphasize={emphasize}
          />
        );
      })}
    </>
  );
}

/** @deprecated Use LegalPremiumHero — kept for any legacy imports */
export function LegalPageHero(props: {
  purpose: string;
  eyebrow: string;
  title: string;
  lead: string;
}) {
  return <LegalPremiumHero {...props} lastUpdated="16 July 2026" readingMinutes={5} />;
}

/** @deprecated Use LegalSectionsBody inside LegalDocumentLayout */
export function LegalPageBody({ sections }: { sections: readonly LegalSection[] }) {
  return (
    <PublicPageContainer className="py-10 sm:py-12">
      <div className="mx-auto max-w-3xl space-y-6">
        <LegalSectionsBody sections={sections} />
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

/** @deprecated Use LegalSectionCard */
export function LegalSectionBlock({ section }: { section: LegalSection }) {
  return <LegalSectionCard section={section} index={0} />;
}
