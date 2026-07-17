"use client";

import Link from "next/link";
import { Award } from "lucide-react";

import { Button } from "@/components/ui";
import { useI18n } from "@/features/i18n/i18n-provider";

const MILESTONE_KEYS = [
  "success.milestones.account_verified",
  "success.milestones.first_deposit",
  "success.milestones.first_investment",
  "success.milestones.first_roi",
  "success.milestones.first_withdrawal",
  "success.milestones.first_statement",
] as const;

/** G1 shell — fact-based milestones only; no live computation yet. */
export function MilestonesShell() {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      <p className="sr-only">{t("success.milestones.sr_question")}</p>
      <section className="rounded-xl border border-border/80 p-5">
        <div className="flex items-start gap-3">
          <Award className="mt-0.5 size-5 text-muted-foreground" aria-hidden />
          <div className="space-y-2">
            <h2 className="text-base font-semibold">{t("success.milestones.title")}</h2>
            <p className="text-sm text-muted-foreground">{t("success.milestones.description")}</p>
            <Button asChild variant="link" className="h-auto px-0">
              <Link href="/account/success">{t("success.milestones.back")}</Link>
            </Button>
          </div>
        </div>
      </section>

      <ul className="space-y-3">
        {MILESTONE_KEYS.map((key) => (
          <li
            key={key}
            className="flex items-center justify-between rounded-xl border border-dashed border-border/80 px-4 py-3"
          >
            <span className="text-sm text-foreground">{t(key)}</span>
            <span className="text-xs text-muted-foreground">
              {t("success.milestones.shell_notice")}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
