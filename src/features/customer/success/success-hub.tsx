import Link from "next/link";
import { Sprout } from "lucide-react";

import { Button } from "@/components/ui";
import {
  SUCCESS_HUB_LINKS,
  SUCCESS_PROGRESS_PILLARS,
} from "@/features/customer/success/success-nav";

import { SuccessProgressFramework } from "./progress-framework";

export function CustomerSuccessHub() {
  return (
    <div className="space-y-8">
      <p className="sr-only">Primary question: How can I become more successful?</p>
      <section className="rounded-xl border border-border/80 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <Sprout className="mt-0.5 size-5 text-muted-foreground" aria-hidden />
          <div className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">Customer Success Hub</h2>
            <p className="text-sm text-muted-foreground">
              Guidance that helps you succeed on Unique Sky Way — learn, keep records, recommend
              responsibly, and notice real progress. Your money home remains the Dashboard; this hub
              does not invent balances or promotions.
            </p>
          </div>
        </div>
      </section>

      <div>
        <h2 className="mb-3 text-sm font-medium tracking-wide text-muted-foreground uppercase">
          Success destinations
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {SUCCESS_HUB_LINKS.map((item) => {
            const Icon = item.icon;
            return (
              <section key={item.href} className="rounded-xl border border-border/80 p-5">
                <div className="flex items-start gap-3">
                  <Icon className="mt-0.5 size-5 text-muted-foreground" aria-hidden />
                  <div>
                    <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{item.sprintNote}</p>
                    <Button asChild variant="link" className="mt-2 h-auto px-0">
                      <Link href={item.href}>Open</Link>
                    </Button>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <SuccessProgressFramework pillars={[...SUCCESS_PROGRESS_PILLARS]} />
    </div>
  );
}
