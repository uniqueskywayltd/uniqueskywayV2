import Link from "next/link";
import { Megaphone } from "lucide-react";

import { Button } from "@/components/ui";
import { WHATS_NEW_ITEMS } from "@/application/customer/communication-presentation";
import { AccountWelcomeHero } from "@/features/customer/account/account-welcome-hero";
import { CommunicationsReveal } from "@/features/customer/communications/communications-motion";
import { CommunicationsSurfaceNav } from "@/features/customer/communications/communications-surface-nav";

/** What’s New — certified presentation catalog only (no announcement engine). */
export function WhatsNewSurface() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 sm:space-y-9">
      <CommunicationsReveal>
        <AccountWelcomeHero
          title="What’s New"
          description="What do I need to know right now about the platform? Product updates and approved announcements — not a marketing blast."
          icon={Megaphone}
          accentClassName="bg-fuchsia-500/10 text-fuchsia-800 ring-fuchsia-500/20 dark:text-fuchsia-400"
          barClassName="via-fuchsia-500/70"
          ariaLabel="What’s New header"
        />
      </CommunicationsReveal>

      <CommunicationsReveal delayMs={40}>
        <CommunicationsSurfaceNav />
      </CommunicationsReveal>

      <CommunicationsReveal delayMs={80}>
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Product updates</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Subtle improvements after releases. Deep links open existing certified surfaces.
            </p>
          </div>
          <ul className="space-y-3">
              {WHATS_NEW_ITEMS.map((item) => (
                <li
                  key={item.id}
                  className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm"
                >
                  <p className="text-xs text-muted-foreground">{item.date}</p>
                  <h3 className="mt-1 text-base font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.summary}</p>
                  <Button asChild variant="link" className="mt-2 h-auto px-0">
                    <Link href={item.href}>Open</Link>
                  </Button>
                </li>
              ))}
            </ul>
        </section>
      </CommunicationsReveal>

      <CommunicationsReveal delayMs={100}>
        <section className="space-y-3 rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Service messages</h2>
          <p className="text-sm text-muted-foreground">
            Maintenance and service notices appear in Notifications when the platform publishes
            them. There is no separate announcement stream beyond certified notification and
            presentation catalogs.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href="/account/notifications">Open notifications</Link>
          </Button>
        </section>
      </CommunicationsReveal>
    </div>
  );
}
