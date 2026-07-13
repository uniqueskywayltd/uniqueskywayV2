import Link from "next/link";

import { BrandMark } from "@/components/layout/brand-mark";
import { PUBLIC_FOOTER_COLUMNS } from "@/features/public/navigation";
import { marketingTransitionClassName } from "@/features/public/components/motion";
import { SEO_DEFAULTS } from "@/lib/seo/metadata";

export function PublicFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t bg-background">
      <div className="mx-auto w-full max-w-[90rem] px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <BrandMark />
            <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">
              Structured investment with transparent processes and clear expectations.
            </p>
          </div>
          {PUBLIC_FOOTER_COLUMNS.map((column) => (
            <div key={column.title}>
              <p className="text-sm font-semibold text-foreground">{column.title}</p>
              <ul className="mt-3 space-y-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={`${marketingTransitionClassName("fast")} text-sm text-muted-foreground hover:text-foreground`}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {SEO_DEFAULTS.siteName}. Investments involve risk.
          </p>
          <p>Public foundation · Sprint A1</p>
        </div>
      </div>
    </footer>
  );
}
