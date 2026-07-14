"use client";

import Link from "next/link";
import { Mail, MapPin } from "lucide-react";

import { BrandMark } from "@/components/layout/brand-mark";
import { useI18n } from "@/features/i18n/i18n-provider";
import {
  PUBLIC_FOOTER_COMPANY_LINKS,
  PUBLIC_FOOTER_SUPPORT_LINKS,
} from "@/features/public/navigation";

export function PublicFooter() {
  const { t } = useI18n();

  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <BrandMark surface="onDark" className="[&_img]:h-10 [&_img]:w-auto [&_img]:max-w-[160px]" />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">{t("footer.tagline")}</p>
          </div>

          <div>
            <p className="text-sm font-semibold text-white">{t("footer.company")}</p>
            <ul className="mt-4 space-y-3 text-sm">
              {PUBLIC_FOOTER_COMPANY_LINKS.map((link) => (
                <li key={`${link.href}-${link.labelKey}`}>
                  <Link href={link.href} className="text-slate-400 hover:text-white">
                    {t(link.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-white">{t("footer.support_legal")}</p>
            <ul className="mt-4 space-y-3 text-sm">
              {PUBLIC_FOOTER_SUPPORT_LINKS.map((link) => (
                <li key={`${link.href}-${link.labelKey}`}>
                  <Link href={link.href} className="text-slate-400 hover:text-white">
                    {t(link.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
            <ul className="mt-6 space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                <a href="mailto:info@uniqueskyway.com" className="text-slate-400 hover:text-white">
                  info@uniqueskyway.com
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                <span className="text-slate-400">
                  {t("footer.location_city")}
                  <br />
                  {t("footer.location_country")}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-8 sm:flex-row">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} Unique Sky Way. {t("footer.rights")}
          </p>
          <p className="text-xs text-slate-600">{t("footer.secure_line")}</p>
        </div>
      </div>
    </footer>
  );
}
