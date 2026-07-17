"use client";

import Link from "next/link";
import { Megaphone } from "lucide-react";

import { Button } from "@/components/ui";
import { WHATS_NEW_ITEMS } from "@/application/customer/communication-presentation";
import { AccountWelcomeHero } from "@/features/customer/account/account-welcome-hero";
import { CommunicationsReveal } from "@/features/customer/communications/communications-motion";
import { CommunicationsSurfaceNav } from "@/features/customer/communications/communications-surface-nav";
import { useI18n } from "@/features/i18n/i18n-provider";

/** What's New — certified presentation catalog only (no announcement engine). */
export function WhatsNewSurface() {
  const { t } = useI18n();

  return (
    <div className="mx-auto max-w-3xl space-y-8 sm:space-y-9">
      <CommunicationsReveal>
        <AccountWelcomeHero
          title={t("whats_new.title")}
          description={t("whats_new.hero_description")}
          icon={Megaphone}
          accentClassName="bg-fuchsia-500/10 text-fuchsia-800 ring-fuchsia-500/20 dark:text-fuchsia-400"
          barClassName="via-fuchsia-500/70"
          ariaLabel={t("whats_new.header_aria")}
        />
      </CommunicationsReveal>

      <CommunicationsReveal delayMs={40}>
        <CommunicationsSurfaceNav />
      </CommunicationsReveal>

      <CommunicationsReveal delayMs={80}>
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {t("whats_new.product_updates")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("whats_new.product_updates_desc")}
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
                  <Link href={item.href}>{t("communications.open")}</Link>
                </Button>
              </li>
            ))}
          </ul>
        </section>
      </CommunicationsReveal>

      <CommunicationsReveal delayMs={100}>
        <section className="space-y-3 rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">
            {t("whats_new.service_messages")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("whats_new.service_messages_desc")}</p>
          <Button asChild variant="outline" size="sm">
            <Link href="/account/notifications">{t("whats_new.open_notifications")}</Link>
          </Button>
        </section>
      </CommunicationsReveal>
    </div>
  );
}
