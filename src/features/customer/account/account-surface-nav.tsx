"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MonitorSmartphone, Settings2, Shield, UserRound } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const items = [
  { href: "/account", label: "Overview", exact: true },
  { href: "/account/profile", label: "Profile", exact: true },
  { href: "/account/security", label: "Security", exact: true },
  { href: "/account/preferences", label: "Preferences", exact: true },
  { href: "/account/security/trusted-devices", label: "Devices", exact: true },
  { href: "/account/security/sessions", label: "Sessions", exact: true },
] as const;

const iconByHref = {
  "/account": UserRound,
  "/account/profile": UserRound,
  "/account/security": Shield,
  "/account/preferences": Settings2,
  "/account/security/trusted-devices": MonitorSmartphone,
  "/account/security/sessions": MonitorSmartphone,
} as const;

/** In-surface nav for Profile & Security controls. */
export function AccountSurfaceNav() {
  const pathname = usePathname();

  return (
    <section aria-label="Account controls navigation">
      <div className="flex flex-wrap gap-2.5 sm:gap-2">
        {items.map(({ href, label, exact }) => {
          const Icon = iconByHref[href];
          const active = exact ? pathname === href : pathname.startsWith(href);
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
              {label}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
