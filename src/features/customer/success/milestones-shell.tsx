import Link from "next/link";
import { Award } from "lucide-react";

import { Button } from "@/components/ui";

const MILESTONE_EXAMPLES = [
  "Account verified",
  "First deposit confirmed",
  "First investment activated",
  "First ROI credited",
  "First withdrawal paid",
  "First statement ready",
] as const;

/** G1 shell — fact-based milestones only; no live computation yet. */
export function MilestonesShell() {
  return (
    <div className="space-y-6">
      <p className="sr-only">Primary question: What real progress have I already made?</p>
      <section className="rounded-xl border border-border/80 p-5">
        <div className="flex items-start gap-3">
          <Award className="mt-0.5 size-5 text-muted-foreground" aria-hidden />
          <div className="space-y-2">
            <h2 className="text-base font-semibold">Milestones</h2>
            <p className="text-sm text-muted-foreground">
              Quiet acknowledgement of real platform events — never streaks, points, or pressure to
              deposit. Live milestone tracking will use certified events only.
            </p>
            <Button asChild variant="link" className="h-auto px-0">
              <Link href="/account/success">Back to Success Hub</Link>
            </Button>
          </div>
        </div>
      </section>

      <ul className="space-y-3">
        {MILESTONE_EXAMPLES.map((label) => (
          <li
            key={label}
            className="flex items-center justify-between rounded-xl border border-dashed border-border/80 px-4 py-3"
          >
            <span className="text-sm text-foreground">{label}</span>
            <span className="text-xs text-muted-foreground">Shell — not scored yet</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
