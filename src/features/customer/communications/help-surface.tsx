"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { HelpCircle, LifeBuoy, Search } from "lucide-react";

import { Button, EmptyState, Input } from "@/components/ui";
import {
  HELP_ARTICLES,
  searchHelpArticles,
} from "@/application/customer/communication-presentation";
import { AccountWelcomeHero } from "@/features/customer/account/account-welcome-hero";
import { CommunicationsReveal } from "@/features/customer/communications/communications-motion";
import { CommunicationsSurfaceNav } from "@/features/customer/communications/communications-surface-nav";
import { useI18n } from "@/features/i18n/i18n-provider";

/** Help Center — approved articles + existing support/FAQ paths only. */
export function HelpSurface() {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const articles = useMemo(() => searchHelpArticles(deferredQuery), [deferredQuery]);

  return (
    <div className="mx-auto max-w-3xl space-y-8 sm:space-y-9">
      <CommunicationsReveal>
        <AccountWelcomeHero
          title={t("help.title")}
          description={t("help.hero_description")}
          icon={HelpCircle}
          accentClassName="bg-emerald-500/10 text-emerald-800 ring-emerald-500/20 dark:text-emerald-400"
          barClassName="via-emerald-500/70"
          ariaLabel={t("help.header_aria")}
        />
      </CommunicationsReveal>

      <CommunicationsReveal delayMs={40}>
        <CommunicationsSurfaceNav />
      </CommunicationsReveal>

      <CommunicationsReveal delayMs={80}>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="help-article-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("help.search_placeholder")}
            className="pl-9"
            aria-label={t("help.search_placeholder")}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/account/help/support">{t("help.request_support")}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/faq">{t("help.public_faq")}</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/contact">{t("help.contact")}</Link>
          </Button>
        </div>
      </CommunicationsReveal>

      <CommunicationsReveal delayMs={100}>
        {articles.length === 0 ? (
          <EmptyState
            icon={LifeBuoy}
            title={t("help.no_match")}
            description={t("help.no_match_desc")}
            action={
              <Button asChild>
                <Link href="/account/help/support">{t("help.request_support")}</Link>
              </Button>
            }
          />
        ) : (
          <ul className="space-y-4">
            {articles.map((article) => (
              <li
                key={article.id}
                className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm"
              >
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  {article.category}
                </p>
                <h2 className="mt-1 text-base font-semibold text-foreground">{article.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{article.summary}</p>
                <p className="mt-3 text-sm leading-6 text-foreground/90">{article.body}</p>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-6 text-sm text-muted-foreground">
          {t("help.articles_footer", { count: HELP_ARTICLES.length })}
        </p>
      </CommunicationsReveal>
    </div>
  );
}
