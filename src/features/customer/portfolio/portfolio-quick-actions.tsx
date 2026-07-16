import Link from "next/link";
import { LayoutDashboard, PieChart, ScrollText, Sparkles, Wallet } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const actions = [
  { href: "/portfolio/activate", label: "Activate investment", icon: PieChart },
  { href: "/plans", label: "Explore plans", icon: Sparkles },
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/ledger", label: "Ledger", icon: ScrollText },
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
] as const;

/** PF1 — portfolio navigation shortcuts only (not dashboard widgets). */
export function PortfolioQuickActions() {
  return (
    <section aria-label="Portfolio navigation">
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
