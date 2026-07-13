import Link from "next/link";
import { BookOpen } from "lucide-react";

import { Button } from "@/components/ui";

const LEARNING_TOPICS = [
  {
    title: "Investment basics",
    description: "How plans, principal, and maturity are explained on this platform.",
  },
  {
    title: "Wallet & ROI language",
    description: "Accrued earnings, credited ROI, available, and withdrawable — kept distinct.",
  },
  {
    title: "Security essentials",
    description: "Sessions, trusted devices, and what real security alerts look like.",
  },
  {
    title: "Platform guides",
    description: "Deposits, withdrawals in review, New York settlement expectancy, and statements.",
  },
] as const;

/** G1 shell — topic map only; article content arrives in Sprint G3. */
export function LearningHubShell() {
  return (
    <div className="space-y-6">
      <p className="sr-only">Primary question: What should I learn next?</p>
      <section className="rounded-xl border border-border/80 p-5">
        <div className="flex items-start gap-3">
          <BookOpen className="mt-0.5 size-5 text-muted-foreground" aria-hidden />
          <div className="space-y-2">
            <h2 className="text-base font-semibold">Learning hub</h2>
            <p className="text-sm text-muted-foreground">
              Short, honest explainers aligned to the glossary. Full articles and progress tracking
              arrive in Sprint G3. Nothing here invents returns or blocks money actions.
            </p>
            <Button asChild variant="link" className="h-auto px-0">
              <Link href="/account/help">Browse Help Center meanwhile</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        {LEARNING_TOPICS.map((topic) => (
          <section key={topic.title} className="rounded-xl border border-dashed border-border/80 p-5">
            <h3 className="text-sm font-semibold text-foreground">{topic.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{topic.description}</p>
            <p className="mt-3 text-xs text-muted-foreground">Coming in Sprint G3</p>
          </section>
        ))}
      </div>
    </div>
  );
}
