import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, PieChart, Wallet } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const actions = [
  { href: "/wallet/deposits/new", label: "Deposit", icon: ArrowDownLeft },
  { href: "/wallet/withdrawals/new", label: "Withdraw", icon: ArrowUpRight },
  { href: "/portfolio", label: "Investments", icon: PieChart },
  { href: "/wallet", label: "Wallet", icon: Wallet },
] as const;

export function DashboardQuickActions() {
  return (
    <section aria-label="Quick actions">
      <div className="flex flex-wrap gap-2">
        {actions.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {label}
          </Link>
        ))}
      </div>
    </section>
  );
}
