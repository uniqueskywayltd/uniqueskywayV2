import Link from "next/link";

import { Button } from "@/components/ui";
import { PublicPageContainer, PublicShell } from "@/features/public/components/public-shell";

const RECOVERY_LINKS = [
  { label: "Homepage", href: "/" },
  { label: "Investment plans", href: "/plans" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
  { label: "How it works", href: "/how-it-works" },
] as const;

export default function NotFound() {
  return (
    <PublicShell>
      <div className="border-b border-border/70 bg-[radial-gradient(90%_80%_at_50%_0%,oklch(0.94_0.015_250)_0%,oklch(0.985_0.004_250)_55%)]">
        <PublicPageContainer className="py-20 sm:py-24">
          <p className="text-sm font-medium tracking-[0.16em] text-muted-foreground uppercase">
            404
          </p>
          <h1 className="mt-4 max-w-2xl font-[family-name:var(--font-instrument-serif)] text-4xl tracking-normal text-foreground sm:text-5xl">
            This page is unavailable.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
            The address may be mistyped, or the page may have moved. Use the links below to return
            to a known surface—no pressure, just a clear path forward.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/">Return home</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/faq">Search the FAQ</Link>
            </Button>
          </div>

          <nav aria-label="Suggested destinations" className="mt-12">
            <p className="text-sm font-semibold text-foreground">Continue here</p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {RECOVERY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex rounded-xl border border-border/80 bg-background px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </PublicPageContainer>
      </div>
    </PublicShell>
  );
}
