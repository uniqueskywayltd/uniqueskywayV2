"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Bell, HelpCircle, Megaphone, MessagesSquare } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { useI18n } from "@/features/i18n/i18n-provider";
import { cn } from "@/lib/utils";

const items = [
  {
    href: "/account/communications",
    labelKey: "communications.nav.center",
    exact: true,
    icon: MessagesSquare,
  },
  { href: "/account/notifications", labelKey: "notifications.title", exact: true, icon: Bell },
  { href: "/account/activity", labelKey: "nav.activity", exact: true, icon: Activity },
  { href: "/account/whats-new", labelKey: "whats_new.title", exact: true, icon: Megaphone },
  { href: "/account/help", labelKey: "nav.help", exact: true, icon: HelpCircle },
] as const;

/** In-surface nav for Notifications & Communication. */
export function CommunicationsSurfaceNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <section aria-label={t("communications.nav.aria")}>
      <div className="flex flex-wrap gap-2.5 sm:gap-2">
        {items.map(({ href, labelKey, exact, icon: Icon }) => {
          const active = exact
            ? pathname === href ||
              (href === "/account/help" && pathname.startsWith("/account/help"))
            : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                buttonVariants({ variant: active ? "default" : "outline", size: "sm" }),
                "gap-2 motion-safe:transition-[color,background-color,border-color,box-shadow,transform] motion-safe:duration-200 motion-reduce:transition-none motion-safe:hover:-translate-y-0.5 focus-visible:ring-offset-2",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {t(labelKey)}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
