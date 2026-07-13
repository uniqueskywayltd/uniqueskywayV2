import Link from "next/link";
import { Bell, Gift, HelpCircle, History, Megaphone, MessagesSquare, Sprout } from "lucide-react";

import { Button } from "@/components/ui";

const HUB_LINKS = [
  {
    href: "/account/success",
    title: "Customer Success Hub",
    description: "How can I become more successful?",
    icon: Sprout,
  },
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
    href: "/account/help",
    title: "Help Center",
    description: "Educational guidance and support.",
    icon: HelpCircle,
  },
  {
    href: "/account/referrals",
    title: "Referrals",
    description: "Recommend responsibly — privacy-first.",
    icon: Gift,
  },
  {
    href: "/account/whats-new",
    title: "What’s New",
    description: "Subtle product improvements — not marketing blast.",
    icon: Megaphone,
  },
  {
    href: "/account/preferences",
    title: "Notification preferences",
    description: "How should we reach you?",
    icon: MessagesSquare,
  },
] as const;

export function CommunicationCenter() {
  return (
    <div className="space-y-6">
      <p className="sr-only">Primary question: What do I need to know right now?</p>
      <p className="text-sm text-muted-foreground">
        One place for customer communication — notifications, activity, help, referrals, and
        release notes — without payment redesign or engine changes.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {HUB_LINKS.map((item) => {
          const Icon = item.icon;
          return (
            <section key={item.href} className="rounded-xl border border-border/80 p-5">
              <div className="flex items-start gap-3">
                <Icon className="mt-0.5 size-5 text-muted-foreground" aria-hidden />
                <div>
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
    </div>
  );
}
