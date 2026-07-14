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

/** Help Center — approved articles + existing support/FAQ paths only. */
export function HelpSurface() {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const articles = useMemo(() => searchHelpArticles(deferredQuery), [deferredQuery]);

  return (
    <div className="mx-auto max-w-3xl space-y-8 sm:space-y-9">
      <CommunicationsReveal>
        <AccountWelcomeHero
          title="Help Center"
          description="What do I need to know right now? Search approved guidance first — then support if you still need help."
          icon={HelpCircle}
          accentClassName="bg-emerald-500/10 text-emerald-800 ring-emerald-500/20 dark:text-emerald-400"
          barClassName="via-emerald-500/70"
          ariaLabel="Help Center header"
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
              placeholder="Search guidance"
              className="pl-9"
              aria-label="Search help articles"
            />
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/account/help/support">Request support</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/faq">Public FAQ</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/contact">Contact</Link>
          </Button>
        </div>
      </CommunicationsReveal>

      <CommunicationsReveal delayMs={100}>
        {articles.length === 0 ? (
          <EmptyState
            icon={LifeBuoy}
            title="No matching guidance"
            description="Try another search, or open a support request if you still need help."
            action={
              <Button asChild>
                <Link href="/account/help/support">Request support</Link>
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
          {HELP_ARTICLES.length} approved educational articles. This is guidance — not investment
          advice.
        </p>
      </CommunicationsReveal>
    </div>
  );
}
