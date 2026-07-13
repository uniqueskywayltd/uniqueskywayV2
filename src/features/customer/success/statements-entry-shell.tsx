import Link from "next/link";
import { FileText } from "lucide-react";

import { Button } from "@/components/ui";

/** G1 entry — full statement product is Sprint G2 (`DEC-0047`). */
export function StatementsEntryShell() {
  return (
    <div className="space-y-6">
      <p className="sr-only">Primary question: Can I understand my financial history?</p>
      <section className="rounded-xl border border-border/80 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <FileText className="mt-0.5 size-5 text-muted-foreground" aria-hidden />
          <div className="space-y-3">
            <h2 className="text-base font-semibold">Statements</h2>
            <p className="text-sm text-muted-foreground">
              Official records — monthly statements, investment summaries, and ledger summaries —
              will project certified ledger data only. No independently calculated totals. Full
              period pickers, previews, and downloads arrive in Sprint G2.
            </p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>Monthly / period statements</li>
              <li>Investment summaries</li>
              <li>Ledger summaries</li>
              <li>Download history & statement timeline</li>
            </ul>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline">
                <Link href="/ledger">Review live ledger</Link>
              </Button>
              <Button asChild variant="link" className="h-auto px-0">
                <Link href="/account/success">Back to Success Hub</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
