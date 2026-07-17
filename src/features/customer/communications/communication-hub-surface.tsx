"use client";

import Link from "next/link";
import { Bell, Gift, HelpCircle, History, Megaphone, MessagesSquare, Sprout } from "lucide-react";

import { Button } from "@/components/ui";
import { AccountWelcomeHero } from "@/features/customer/account/account-welcome-hero";
import { CommunicationsReveal } from "@/features/customer/communications/communications-motion";
import { CommunicationsSurfaceNav } from "@/features/customer/communications/communications-surface-nav";
import { useI18n } from "@/features/i18n/i18n-provider";

const HUB_LINKS = [
  {
    href: "/account/notifications",
    titleKey: "communications.hub.notifications",
    descriptionKey: "communications.hub.notifications_desc",
    icon: Bell,
  },
  {
    href: "/account/activity",
    titleKey: "communications.hub.activity",
    descriptionKey: "communications.hub.activity_desc",
    icon: History,
  },
  {
    href: "/account/whats-new",
    titleKey: "communications.hub.whats_new",
    descriptionKey: "communications.hub.whats_new_desc",
    icon: Megaphone,
  },
  {
    href: "/account/help",
    titleKey: "communications.hub.help",
    descriptionKey: "communications.hub.help_desc",
    icon: HelpCircle,
  },
  {
    href: "/account/preferences",
    titleKey: "communications.hub.preferences",
    descriptionKey: "communications.hub.preferences_desc",
    icon: MessagesSquare,
  },
  {
    href: "/account/success",
    titleKey: "communications.hub.success",
    descriptionKey: "communications.hub.success_desc",
    icon: Sprout,
  },
  {
    href: "/account/referrals",
    titleKey: "communications.hub.referrals",
    descriptionKey: "communications.hub.referrals_desc",
    icon: Gift,
  },
] as const;

/** Communication Center hub — deep links only; no engines. */
export function CommunicationHubSurface() {
  const { t } = useI18n();

  return (
    <div className="space-y-8 sm:space-y-9">
      <CommunicationsReveal>
        <AccountWelcomeHero
          title={t("communications.center")}
          description={t("communications.hero_description")}
          icon={MessagesSquare}
          accentClassName="bg-cyan-500/10 text-cyan-800 ring-cyan-500/20 dark:text-cyan-400"
          barClassName="via-cyan-500/70"
          ariaLabel={t("communications.header_aria")}
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
                    <h2 className="text-base font-semibold text-foreground">{t(item.titleKey)}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{t(item.descriptionKey)}</p>
                    <Button asChild variant="link" className="mt-2 h-auto px-0">
                      <Link href={item.href}>{t("communications.open")}</Link>
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
