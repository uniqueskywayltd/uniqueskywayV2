"use client";

import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, Inbox, ScrollText, Send } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { useI18n } from "@/features/i18n/i18n-provider";
import { cn } from "@/lib/utils";

/** WP1–WP5 — wallet navigation (ops shortcuts only). */
export function WalletQuickActions() {
  const { t } = useI18n();
  const actions = [
    { href: "/wallet/deposits/new", label: t("wallet.action.deposit"), icon: ArrowDownLeft },
    { href: "/wallet/withdrawals/new", label: t("wallet.action.withdraw"), icon: ArrowUpRight },
    { href: "/wallet/deposits", label: t("wallet.action.deposits"), icon: Inbox },
    { href: "/wallet/withdrawals", label: t("wallet.action.withdrawals"), icon: Send },
    { href: "/ledger", label: t("wallet.action.ledger"), icon: ScrollText },
  ] as const;

  return (
    <section aria-label={t("wallet.nav_aria")}>
      <div className="flex flex-wrap gap-2.5 sm:gap-2">
        {actions.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-2 motion-safe:transition-[color,background-color,border-color,box-shadow,transform] motion-safe:duration-200 motion-reduce:transition-none motion-safe:hover:-translate-y-0.5 focus-visible:ring-offset-2",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            {label}
          </Link>
        ))}
      </div>
    </section>
  );
}
