"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowUp, ChevronDown, Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PublicPageContainer } from "@/features/public/components/public-shell";
import {
  marketingOutlineBtn,
  marketingPrimaryBtn,
} from "@/features/public/components/marketing-ui";
import { cn } from "@/lib/utils";

import { slugifyLegalHeading } from "./legal-utils";

export type LegalTocItem = {
  id: string;
  title: string;
};

export function LegalScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function onScroll() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? Math.min(1, scrollTop / docHeight) : 0);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-40 h-0.5 bg-border/40"
      aria-hidden="true"
    >
      <div
        className="h-full bg-primary transition-[width] duration-150 ease-out"
        style={{ width: `${progress * 100}%` }}
      />
    </div>
  );
}

export function LegalBackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 480);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <Button
      type="button"
      size="icon"
      variant="outline"
      className="fixed right-4 bottom-6 z-40 size-11 rounded-full shadow-md sm:right-6"
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      <ArrowUp className="size-4" aria-hidden />
    </Button>
  );
}

function scrollToSection(id: string) {
  const target = document.getElementById(id);
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function LegalTableOfContents({
  items,
  activeId,
  className,
}: {
  items: LegalTocItem[];
  activeId: string | null;
  className?: string;
}) {
  return (
    <nav aria-label="Table of contents" className={className}>
      <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
        On this page
      </p>
      <ol className="mt-3 space-y-1">
        {items.map((item, index) => {
          const active = activeId === item.id;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={(event) => {
                  event.preventDefault();
                  scrollToSection(item.id);
                }}
                className={cn(
                  "block rounded-lg px-3 py-2 text-sm leading-snug transition-colors",
                  active
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
                aria-current={active ? "location" : undefined}
              >
                <span className="mr-2 tabular-nums text-muted-foreground">{index + 1}.</span>
                {item.title}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function LegalMobileToc({
  items,
  activeId,
}: {
  items: LegalTocItem[];
  activeId: string | null;
}) {
  const [open, setOpen] = useState(false);
  const activeTitle = items.find((item) => item.id === activeId)?.title ?? "Jump to section";

  return (
    <div className="lg:hidden">
      <button
        type="button"
        className="flex w-full items-center justify-between rounded-xl border border-border/70 bg-card px-4 py-3 text-left text-sm font-medium shadow-sm"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="flex items-center gap-2">
          <Menu className="size-4 text-muted-foreground" aria-hidden />
          {open ? "Table of contents" : activeTitle}
        </span>
        <ChevronDown
          className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>
      {open ? (
        <div className="mt-2 rounded-xl border border-border/70 bg-card p-3 shadow-sm">
          <LegalTableOfContents
            items={items}
            activeId={activeId}
            className="max-h-64 overflow-y-auto"
          />
        </div>
      ) : null}
    </div>
  );
}

export function useLegalScrollSpy(sectionIds: string[]) {
  const [activeId, setActiveId] = useState<string | null>(sectionIds[0] ?? null);
  const idsKey = sectionIds.join("|");

  useEffect(() => {
    if (sectionIds.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0, 0.25, 0.5, 1] },
    );

    for (const id of sectionIds) {
      const node = document.getElementById(id);
      if (node) observer.observe(node);
    }

    return () => observer.disconnect();
  }, [idsKey, sectionIds]);

  return activeId;
}

export function LegalDocumentLayout({
  tocItems,
  children,
}: {
  tocItems: LegalTocItem[];
  children: ReactNode;
}) {
  const sectionIds = useMemo(() => tocItems.map((item) => item.id), [tocItems]);
  const activeId = useLegalScrollSpy(sectionIds);

  return (
    <>
      <LegalScrollProgress />
      <PublicPageContainer className="py-10 sm:py-12">
        <LegalMobileToc items={tocItems} activeId={activeId} />

        <div className="mt-6 grid gap-10 lg:mt-0 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] lg:gap-12 xl:grid-cols-[minmax(0,16rem)_minmax(0,42rem)_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <LegalTableOfContents items={tocItems} activeId={activeId} />
            </div>
          </aside>

          <div className="min-w-0 space-y-6 lg:max-w-3xl">{children}</div>
        </div>

        <LegalHelpSection className="mx-auto mt-12 max-w-3xl lg:col-span-2" />
      </PublicPageContainer>
      <LegalBackToTop />
    </>
  );
}

export function LegalHelpSection({ className }: { className?: string }) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/8 via-card to-card p-6 shadow-sm sm:p-8",
        className,
      )}
      aria-label="Need help"
    >
      <h2 className="text-xl font-semibold tracking-tight text-foreground">
        Still have questions?
      </h2>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
        Need help understanding this policy? Our support team can walk you through what it means for
        your account.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link href="/contact" className={marketingPrimaryBtn()}>
          Contact Support
        </Link>
        <Link href="/contact" className={marketingOutlineBtn()}>
          Contact Us
        </Link>
      </div>
    </section>
  );
}

export function buildTocFromSections(sections: ReadonlyArray<{ title: string }>): LegalTocItem[] {
  return sections.map((section) => ({
    id: slugifyLegalHeading(section.title),
    title: section.title,
  }));
}
