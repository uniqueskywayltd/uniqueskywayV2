import Link from "next/link";
import { LayoutDashboard, PieChart, ScrollText, Sparkles, Wallet } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { useI18n } from "@/features/i18n/i18n-provider";
import { cn } from "@/lib/utils";

/** PF1 — portfolio navigation shortcuts only (not dashboard widgets). */
export function PortfolioQuickActions() {
  const { t } = useI18n();
  const actions = [
    { href: "/portfolio", label: t("portfolio.actions.manage"), icon: PieChart },
    { href: "/wallet/deposits/new", label: t("portfolio.actions.deposit"), icon: Wallet },
    { href: "/plans", label: t("portfolio.actions.plans"), icon: Sparkles },
    { href: "/ledger", label: t("portfolio.actions.ledger"), icon: ScrollText },
    { href: "/dashboard", label: t("portfolio.actions.overview"), icon: LayoutDashboard },
  ] as const;

  return (
    <section aria-label={t("portfolio.actions.manage")}>
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
