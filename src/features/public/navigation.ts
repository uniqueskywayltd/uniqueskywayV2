export const PUBLIC_PRIMARY_NAV = [
  { labelKey: "nav.about", href: "/about" },
  { labelKey: "nav.investments", href: "/plans" },
  { labelKey: "nav.how_it_works", href: "/how-it-works" },
  { labelKey: "nav.referrals", href: "/referrals" },
  { labelKey: "nav.faq", href: "/faq" },
  { labelKey: "nav.contact", href: "/contact" },
  { labelKey: "nav.security", href: "/security" },
] as const;

/** Footer link groups for marketing shell (labels via i18n keys). */
export const PUBLIC_FOOTER_COMPANY_LINKS = [
  { labelKey: "footer.about_us", href: "/about" },
  { labelKey: "nav.investments", href: "/plans" },
  { labelKey: "nav.how_it_works", href: "/how-it-works" },
  { labelKey: "nav.referrals", href: "/referrals" },
  { labelKey: "nav.security", href: "/security" },
] as const;

export const PUBLIC_FOOTER_SUPPORT_LINKS = [
  { labelKey: "nav.faq", href: "/faq" },
  { labelKey: "nav.contact", href: "/contact" },
  { labelKey: "footer.privacy", href: "/legal/privacy" },
  { labelKey: "footer.terms", href: "/legal/terms" },
] as const;
