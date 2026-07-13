"use client";

import { useDeferredValue, useMemo, useState } from "react";

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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="w-full max-w-md">
            <label htmlFor="faq-search" className="text-sm font-medium text-foreground">
              Search
            </label>
            <Input
              id="faq-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={FAQ_COPY.searchPlaceholder}
              className="mt-2"
              autoComplete="off"
            />
          </div>
        </div>

        <div
          className="mt-6 flex flex-wrap gap-2"
          role="tablist"
          aria-label="FAQ categories"
        >
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
                  "rounded-md border px-3 py-1.5 text-sm transition-colors",
                  selected
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {item}
              </button>
            );
          })}
        </div>

        <div className="mt-8 space-y-8">
          {FAQ_CATEGORIES.filter(
            (cat) => category === "All" || category === cat,
          ).map((cat) => {
            const items = filtered.filter((item) => item.category === cat);
            if (items.length === 0) {
              return null;
            }
            return (
              <div key={cat}>
                <h2 className="font-[family-name:var(--font-instrument-serif)] text-2xl tracking-normal text-foreground">
                  {cat}
                </h2>
                <div className="mt-4 divide-y divide-border rounded-xl border border-border/80 bg-background">
                  {items.map((item) => (
                    <details key={item.question} className="group px-4 py-1">
                      <summary className="cursor-pointer list-none py-3 text-sm font-semibold text-foreground outline-none marker:content-none focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
                        <span className="flex items-start justify-between gap-4">
                          {item.question}
                          <span
                            aria-hidden="true"
                            className="mt-0.5 text-muted-foreground transition-transform group-open:rotate-45"
                          >
                            +
                          </span>
                        </span>
                      </summary>
                      <p className="pb-4 text-sm leading-6 text-muted-foreground">{item.answer}</p>
                    </details>
                  ))}
                </div>
              </div>
            );
          })}

          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">{FAQ_COPY.empty}</p>
          ) : null}
        </div>
      </PublicPageContainer>
    </section>
  );
}
