"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { LifeBuoy, Search } from "lucide-react";

import { Button, EmptyState, Input } from "@/components/ui";
import {
  HELP_ARTICLES,
  searchHelpArticles,
} from "@/application/customer/communication-presentation";

export function HelpCenter() {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const articles = useMemo(() => searchHelpArticles(deferredQuery), [deferredQuery]);

  return (
    <div className="space-y-6">
      <p className="sr-only">Primary question: What do I need to know right now?</p>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search guidance"
          className="pl-9"
          aria-label="Search help articles"
        />
      </div>

      <div className="flex flex-wrap gap-3">
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
            <li key={article.id} className="rounded-xl border border-border/80 p-5">
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

      <p className="text-sm text-muted-foreground">
        {HELP_ARTICLES.length} approved educational articles. This is guidance — not investment advice.
      </p>
    </div>
  );
}
