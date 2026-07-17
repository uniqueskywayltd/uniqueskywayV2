"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

import {
  FAQ_CATEGORIES,
  FAQ_COPY,
  type FaqCategory,
} from "@/features/public/content/conversion-pages";
import { PublicPageContainer } from "@/features/public/components/public-shell";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function FaqExplorer() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<FaqCategory | "All">("All");
  const [openQuestion, setOpenQuestion] = useState<string | null>(
    FAQ_COPY.items[0]?.question ?? null,
  );
  const deferredQuery = useDeferredValue(query);

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return FAQ_COPY.items.filter((item) => {
      if (category !== "All" && item.category !== category) {
        return false;
      }
      if (!q) {
        return true;
      }
      return (
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });
  }, [category, deferredQuery]);

  return (
    <section className="py-12 sm:py-14" aria-label="FAQ explorer">
      <PublicPageContainer>
        <div className="mx-auto max-w-3xl">
          <label htmlFor="faq-search" className="text-sm font-medium text-foreground">
            Search
          </label>
          <Input
            id="faq-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search FAQs..."
            className="mt-2"
            autoComplete="off"
            aria-label="Search FAQs"
          />
        </div>

        <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="FAQ categories">
          {(["All", ...FAQ_CATEGORIES] as const).map((item) => {
            const selected = category === item;
            return (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setCategory(item)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                  selected
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border/70 bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground",
                )}
              >
                {item}
              </button>
            );
          })}
        </div>

        <div className="mt-10 space-y-10">
          {FAQ_CATEGORIES.filter((cat) => category === "All" || category === cat).map((cat) => {
            const items = filtered.filter((item) => item.category === cat);
            if (items.length === 0) {
              return null;
            }
            return (
              <div key={cat}>
                <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
                  {cat}
                </h2>
                <div className="mt-4 space-y-3">
                  {items.map((item) => {
                    const open = openQuestion === item.question;
                    const panelId = `faq-panel-${slugFaqQuestion(item.question)}`;
                    const buttonId = `faq-trigger-${slugFaqQuestion(item.question)}`;
                    return (
                      <div
                        key={item.question}
                        className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm"
                      >
                        <button
                          id={buttonId}
                          type="button"
                          aria-expanded={open}
                          aria-controls={panelId}
                          className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-foreground transition-colors hover:bg-muted/30 sm:text-base"
                          onClick={() =>
                            setOpenQuestion((current) =>
                              current === item.question ? null : item.question,
                            )
                          }
                        >
                          <span>{item.question}</span>
                          <ChevronDown
                            className={cn(
                              "mt-0.5 size-5 shrink-0 text-muted-foreground transition-transform duration-200",
                              open && "rotate-180",
                            )}
                            aria-hidden
                          />
                        </button>
                        <div
                          id={panelId}
                          role="region"
                          aria-labelledby={buttonId}
                          className={cn(
                            "grid transition-[grid-template-rows] duration-200 ease-out",
                            open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                          )}
                        >
                          <div className="overflow-hidden">
                            <p className="px-5 pb-5 text-sm leading-7 text-muted-foreground sm:text-base">
                              {item.answer}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {filtered.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">{FAQ_COPY.empty}</p>
          ) : null}
        </div>
      </PublicPageContainer>
    </section>
  );
}

function slugFaqQuestion(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
