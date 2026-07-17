import Link from "next/link";

import { BrandMark } from "@/components/layout/brand-mark";
import { Button } from "@/components/ui";
import { PublicPageContainer, PublicShell } from "@/features/public/components/public-shell";
import { getRequestLanguage } from "@/i18n/request-language";
import { createTranslator } from "@/i18n/translate";

const RECOVERY_LINKS = [
  { labelKey: "nav.home", href: "/" },
  { labelKey: "plans.title", href: "/plans" },
  { labelKey: "nav.faq", href: "/faq" },
  { labelKey: "nav.contact", href: "/contact" },
  { labelKey: "nav.how_it_works", href: "/how-it-works" },
] as const;

export default async function NotFound() {
  const { language } = await getRequestLanguage();
  const t = createTranslator(language);

  return (
    <PublicShell>
      <div className="border-b border-border/70 bg-muted/30 dark:bg-muted/15">
        <PublicPageContainer className="py-20 sm:py-24">
          <BrandMark surface="theme" width={140} className="mb-8 [&_img]:max-h-9" />
          <p className="text-sm font-medium tracking-[0.16em] text-muted-foreground uppercase">
            404
          </p>
          <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            {t("system.not_found_title")}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
            {t("system.not_found_body")}
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/">{t("system.return_home")}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/faq">{t("system.search_faq")}</Link>
            </Button>
          </div>

          <nav aria-label={t("system.continue_here")} className="mt-12">
            <p className="text-sm font-semibold text-foreground">{t("system.continue_here")}</p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {RECOVERY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex rounded-xl border border-border/80 bg-background px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    {t(link.labelKey)}
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
