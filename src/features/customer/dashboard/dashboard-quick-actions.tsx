"use client";

import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, PieChart, Wallet } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { useI18n } from "@/features/i18n/i18n-provider";
import { cn } from "@/lib/utils";

const actions = [
  {
    href: "/wallet/deposits/new",
    labelKey: "dashboard.quick_actions.deposit",
    icon: ArrowDownLeft,
  },
  {
    href: "/wallet/withdrawals/new",
    labelKey: "dashboard.quick_actions.withdraw",
    icon: ArrowUpRight,
  },
  { href: "/portfolio", labelKey: "dashboard.quick_actions.investments", icon: PieChart },
  { href: "/wallet", labelKey: "dashboard.quick_actions.wallet", icon: Wallet },
] as const;

export function DashboardQuickActions() {
  const { t } = useI18n();

  return (
    <section aria-label={t("dashboard.quick_actions.aria")}>
      <div className="flex flex-wrap gap-2.5 sm:gap-2">
        {actions.map(({ href, labelKey, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-2 motion-safe:transition-[color,background-color,border-color,box-shadow,transform] motion-safe:duration-200 motion-reduce:transition-none motion-safe:hover:-translate-y-0.5",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            {t(labelKey)}
          </Link>
        ))}
      </div>
    </section>
  );
}
