import Link from "next/link";
import {
  Bell,
  Gift,
  HelpCircle,
  History,
  Megaphone,
  MessagesSquare,
  Sprout,
} from "lucide-react";

import { Button } from "@/components/ui";
import { AccountWelcomeHero } from "@/features/customer/account/account-welcome-hero";
import { CommunicationsReveal } from "@/features/customer/communications/communications-motion";
import { CommunicationsSurfaceNav } from "@/features/customer/communications/communications-surface-nav";

const HUB_LINKS = [
  {
    href: "/account/notifications",
    title: "Notification Center",
    description: "What do I need to know right now?",
    icon: Bell,
  },
  {
    href: "/account/activity",
    title: "Activity",
    description: "What have I done recently?",
    icon: History,
  },
  {
    href: "/account/whats-new",
    title: "What’s New",
    description: "Product updates and platform announcements.",
    icon: Megaphone,
  },
  {
    href: "/account/help",
    title: "Help Center",
    description: "Guidance, FAQ, and support entry.",
    icon: HelpCircle,
  },
  {
    href: "/account/preferences",
    title: "Notification preferences",
    description: "How should we reach you?",
    icon: MessagesSquare,
  },
  {
    href: "/account/success",
    title: "Customer Success Hub",
    description: "How can I become more successful?",
    icon: Sprout,
  },
  {
    href: "/account/referrals",
    title: "Referrals",
    description: "Recommend responsibly — privacy-first.",
    icon: Gift,
  },
] as const;

/** Communication Center hub — deep links only; no engines. */
export function CommunicationHubSurface() {
  return (
    <div className="space-y-8 sm:space-y-9">
      <CommunicationsReveal>
        <AccountWelcomeHero
          title="Communication Center"
          description="What do I need to know right now? Notifications, activity, announcements, and help — one place to stay informed."
          icon={MessagesSquare}
          accentClassName="bg-cyan-500/10 text-cyan-800 ring-cyan-500/20 dark:text-cyan-400"
          barClassName="via-cyan-500/70"
          ariaLabel="Communication Center header"
        />
      </CommunicationsReveal>

      <CommunicationsReveal delayMs={40}>
        <CommunicationsSurfaceNav />
      </CommunicationsReveal>

      <CommunicationsReveal delayMs={80}>
        <div className="grid gap-4 sm:grid-cols-2">
          {HUB_LINKS.map((item) => {
            const Icon = item.icon;
            return (
              <section
                key={item.href}
                className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    <Icon className="size-5" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold text-foreground">{item.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                    <Button asChild variant="link" className="mt-2 h-auto px-0">
                      <Link href={item.href}>Open</Link>
                    </Button>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      </CommunicationsReveal>
    </div>
  );
}
