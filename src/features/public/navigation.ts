export const PUBLIC_PRIMARY_NAV = [
  { label: "Plans", href: "/plans" },
  { label: "How it works", href: "/how-it-works" },
  { label: "Security", href: "/security" },
  { label: "About", href: "/about" },
  { label: "FAQ", href: "/faq" },
] as const;

export const PUBLIC_FOOTER_COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Plans", href: "/plans" },
      { label: "How it works", href: "/how-it-works" },
      { label: "Security", href: "/security" },
      { label: "FAQ", href: "/faq" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/legal/privacy" },
      { label: "Terms", href: "/legal/terms" },
      { label: "Risk", href: "/legal/risk" },
      { label: "AML", href: "/legal/aml" },
      { label: "KYC", href: "/legal/kyc" },
      { label: "Cookies", href: "/legal/cookies" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Sign in", href: "/auth/login" },
      { label: "Create account", href: "/auth/register" },
    ],
  },
] as const;
