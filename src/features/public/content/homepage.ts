export const HOMEPAGE_COPY = {
  hero: {
    purpose: "Capture attention and communicate the core value proposition.",
    headline: "Invest with clarity.",
    support:
      "Structured investment plans with transparent processes—from funding to withdrawal—designed for long-term stewardship, not speculation.",
    primaryCta: { label: "Get started", href: "/auth/register" },
    secondaryCta: { label: "View plans", href: "/plans" },
  },
  trustBar: {
    purpose: "Remove initial skepticism.",
    items: [
      {
        title: "Verified accounts",
        description: "Email verification before platform access.",
        href: "/security",
      },
      {
        title: "Reviewed money movement",
        description: "Deposits and withdrawals follow clear review statuses.",
        href: "/how-it-works",
      },
      {
        title: "Ledger-backed balances",
        description: "Balances reflect accounted financial activity—not opaque screens.",
        href: "/security",
      },
      {
        title: "Session protection",
        description: "Trusted devices and session controls help keep accounts secure.",
        href: "/security",
      },
    ],
  },
  why: {
    purpose: "Explain why the company exists and why it is different.",
    title: "Why Unique Sky Way",
    lead: "We exist to make investment participation feel clear, calm, and accountable.",
    points: [
      {
        title: "Transparency first",
        description: "Status language and process steps stay visible so you always know where you stand.",
      },
      {
        title: "Long-term posture",
        description: "We design for patient capital—not urgency gimmicks or manufactured scarcity.",
      },
      {
        title: "Respect for risk",
        description: "Returns are never guaranteed. Clear disclosures belong beside every invitation to invest.",
      },
    ],
  },
  journey: {
    purpose: "Show how simple the process is.",
    title: "Your investment journey",
    lead: "Six calm steps from curiosity to withdrawal—no implementation jargon.",
    steps: [
      { label: "Register", detail: "Create your account." },
      { label: "Verify", detail: "Confirm your email." },
      { label: "Fund", detail: "Add funds through approved channels." },
      { label: "Invest", detail: "Activate a published plan." },
      { label: "Earn", detail: "Track credited earnings as they post." },
      { label: "Withdraw", detail: "Request transfers when eligible." },
    ],
    cta: { label: "Learn how it works", href: "/how-it-works" },
  },
  plans: {
    purpose: "Introduce investment opportunities without overwhelming details.",
    title: "Investment plans",
    lead: "Featured plans will appear here from the certified catalog when published.",
    emptyTitle: "Plans will appear when published",
    emptyDescription:
      "Preview cards are ready for the certified plans contract. Until then, nothing is fabricated.",
    footnote: "Returns are not guaranteed. See Risk Disclosure.",
    riskHref: "/legal/risk",
    cta: { label: "Compare all plans", href: "/plans" },
    placeholders: [
      { name: "Featured plan", detail: "Terms from certified catalog" },
      { name: "Featured plan", detail: "Terms from certified catalog" },
      { name: "Featured plan", detail: "Terms from certified catalog" },
    ],
  },
  security: {
    purpose: "Answer “Is my money safe?”",
    title: "Security, without exaggeration",
    lead: "Protection is a practice—not a slogan.",
    pillars: [
      {
        title: "Account protection",
        description: "Sign-in controls, verification, and session awareness.",
      },
      {
        title: "Data protection",
        description: "Sensitive information is handled with care and least necessary exposure.",
      },
      {
        title: "Fund protection",
        description: "Money movement uses reviewed statuses and accounted balances.",
      },
      {
        title: "Audit philosophy",
        description: "Important actions should be explainable—who did what, and when.",
      },
    ],
    cta: { label: "Security overview", href: "/security" },
  },
  story: {
    purpose: "Build long-term credibility.",
    title: "Built for stewardship",
    lead: "Unique Sky Way is committed to clear process, patient growth, and honest communication with investors.",
    values: [
      { title: "Mission", body: "Give investors a calm, understandable path to structured plans." },
      { title: "Vision", body: "An investment experience that earns trust through clarity—not theater." },
      { title: "Values", body: "Transparency, restraint, accountability, and respect for risk." },
    ],
    cta: { label: "Our story", href: "/about" },
  },
  faq: {
    purpose: "Resolve the most common objections.",
    title: "Common questions",
    items: [
      {
        question: "Are returns guaranteed?",
        answer: "No. Investments involve risk, including the possible loss of capital. Always read the Risk Disclosure.",
      },
      {
        question: "How do deposits work?",
        answer: "You submit funding through approved channels. Deposits move through clear review statuses before confirmation.",
      },
      {
        question: "How do withdrawals work?",
        answer: "When eligible, you request a transfer. Requests follow reviewed statuses until completion.",
      },
    ],
    cta: { label: "View all FAQs", href: "/faq" },
  },
  finalCta: {
    purpose: "Encourage registration with confidence.",
    title: "Begin with clarity.",
    support: "Create an account when you are ready. There is no manufactured urgency—only a clear next step.",
    primaryCta: { label: "Get started", href: "/auth/register" },
    secondaryCta: { label: "Contact us", href: "/contact" },
  },
} as const;
