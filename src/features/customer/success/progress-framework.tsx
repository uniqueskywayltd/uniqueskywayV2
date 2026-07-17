import Link from "next/link";

import { Button } from "@/components/ui";

export type ProgressPillar = {
  id: string;
  title: string;
  description: string;
  href: string;
  hrefLabel: string;
};

/** Static success framing — no live scoring, streaks, or points (ENG / G1). */
export function SuccessProgressFramework({
  title,
  description,
  pillars,
}: {
  title: string;
  description: string;
  pillars: ReadonlyArray<ProgressPillar>;
}) {
  return (
    <section aria-labelledby="success-progress-heading" className="space-y-3">
      <div>
        <h2 id="success-progress-heading" className="text-base font-semibold text-foreground">
          {title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <ol className="space-y-3">
        {pillars.map((pillar, index) => (
          <li
            key={pillar.id}
            className="flex flex-col gap-3 rounded-xl border border-border/80 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex gap-3">
              <span
                className="flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-medium text-muted-foreground"
                aria-hidden
              >
                {index + 1}
              </span>
              <div>
                <h3 className="text-sm font-semibold text-foreground">{pillar.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{pillar.description}</p>
              </div>
            </div>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="shrink-0 self-start sm:self-auto"
            >
              <Link href={pillar.href}>{pillar.hrefLabel}</Link>
            </Button>
          </li>
        ))}
      </ol>
    </section>
  );
}
