"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

import {
  FAQ_CATEGORY_IDS,
  getFaqCategoryLabel,
  getFaqItems,
  type FaqCategoryId,
  type FaqItemId,
} from "@/features/public/content/i18n-public-content";
import { PublicPageContainer } from "@/features/public/components/public-shell";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/features/i18n/i18n-provider";
import { cn } from "@/lib/utils";

export function FaqExplorer() {
  const { t } = useI18n();
  const items = useMemo(() => getFaqItems(t), [t]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<FaqCategoryId | "all">("all");
  const [openQuestion, setOpenQuestion] = useState<FaqItemId | null>(items[0]?.id ?? null);
  const deferredQuery = useDeferredValue(query);

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return items.filter((item) => {
      if (category !== "all" && item.category !== category) {
        return false;
      }
      if (!q) {
        return true;
      }
      const categoryLabel = getFaqCategoryLabel(t, item.category).toLowerCase();
      return (
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        categoryLabel.includes(q)
      );
    });
  }, [category, deferredQuery, items, t]);

  return (
    <section className="py-12 sm:py-14" aria-label={t("nav.faq")}>
      <PublicPageContainer>
        <div className="mx-auto max-w-3xl">
          <label htmlFor="faq-search" className="text-sm font-medium text-foreground">
            {t("faq.search")}
          </label>
          <Input
            id="faq-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("faq.search_placeholder")}
            className="mt-2"
            autoComplete="off"
            aria-label={t("faq.search_placeholder")}
          />
        </div>

        <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label={t("faq.categories")}>
          {(["all", ...FAQ_CATEGORY_IDS] as const).map((item) => {
            const selected = category === item;
            const label = item === "all" ? t("faq.all") : getFaqCategoryLabel(t, item);
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
                {label}
              </button>
            );
          })}
        </div>

        <div className="mt-10 space-y-10">
          {FAQ_CATEGORY_IDS.filter((cat) => category === "all" || category === cat).map((cat) => {
            const categoryItems = filtered.filter((item) => item.category === cat);
            if (categoryItems.length === 0) {
              return null;
            }
            return (
              <div key={cat}>
                <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
                  {getFaqCategoryLabel(t, cat)}
                </h2>
                <div className="mt-4 space-y-3">
                  {categoryItems.map((item) => {
                    const open = openQuestion === item.id;
                    const panelId = `faq-panel-${item.id}`;
                    const buttonId = `faq-trigger-${item.id}`;
                    return (
                      <div
                        key={item.id}
                        className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm"
                      >
                        <button
                          id={buttonId}
                          type="button"
                          aria-expanded={open}
                          aria-controls={panelId}
                          className="flex w-full items-start justify-between gap-4 px-5 py-4 text-start text-sm font-semibold text-foreground transition-colors hover:bg-muted/30 sm:text-base"
                          onClick={() =>
                            setOpenQuestion((current) => (current === item.id ? null : item.id))
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
            <p className="text-center text-sm text-muted-foreground">{t("faq.no_results")}</p>
          ) : null}
        </div>
      </PublicPageContainer>
    </section>
  );
}
