"use client";

import Link from "next/link";
import { Sprout } from "lucide-react";

import { Button } from "@/components/ui";
import { useI18n } from "@/features/i18n/i18n-provider";
import {
  SUCCESS_HUB_LINKS,
  SUCCESS_PROGRESS_PILLARS,
} from "@/features/customer/success/success-nav";

import { SuccessProgressFramework } from "./progress-framework";

export function CustomerSuccessHub() {
  const { t } = useI18n();
  const pillars = SUCCESS_PROGRESS_PILLARS.map((pillar) => ({
    id: pillar.id,
    href: pillar.href,
    title: t(pillar.titleKey),
    description: t(pillar.descriptionKey),
    hrefLabel: t(pillar.hrefLabelKey),
  }));

  return (
    <div className="space-y-8">
      <p className="sr-only">{t("success.hub.sr_question")}</p>
      <section className="rounded-xl border border-border/80 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <Sprout className="mt-0.5 size-5 text-muted-foreground" aria-hidden />
          <div className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">{t("success.hub.title")}</h2>
            <p className="text-sm text-muted-foreground">{t("success.hub.intro")}</p>
          </div>
        </div>
      </section>

      <div>
        <h2 className="mb-3 text-sm font-medium tracking-wide text-muted-foreground uppercase">
          {t("success.hub.destinations_title")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {SUCCESS_HUB_LINKS.map((item) => {
            const Icon = item.icon;
            return (
              <section key={item.href} className="rounded-xl border border-border/80 p-5">
                <div className="flex items-start gap-3">
                  <Icon className="mt-0.5 size-5 text-muted-foreground" aria-hidden />
                  <div>
                    <h3 className="text-base font-semibold text-foreground">{t(item.titleKey)}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{t(item.descriptionKey)}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{t(item.sprintNoteKey)}</p>
                    <Button asChild variant="link" className="mt-2 h-auto px-0">
                      <Link href={item.href}>{t("success.hub.open")}</Link>
                    </Button>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <SuccessProgressFramework
        title={t("success.progress.title")}
        description={t("success.progress.description")}
        pillars={pillars}
      />
    </div>
  );
}
