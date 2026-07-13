export const ABOUT_COPY = {
  purpose: "Build company credibility.",
  hero: {
    eyebrow: "About",
    title: "Built for clarity and stewardship.",
    lead: "Unique Sky Way exists to help investors participate in structured plans with calm process, honest language, and long-term accountability.",
  },
  who: {
    title: "Who we are",
    body: "Unique Sky Way is an investment platform focused on transparent participation—not spectacle. We publish sober process, pair every invitation with risk language, and design for people who value understanding before commitment.",
  },
  why: {
    title: "Why we exist",
    body: "Too many investment experiences trade on urgency, opacity, or inflated claims. We exist to offer a quieter alternative: clear steps, accountable money movement, and communication that respects your judgment.",
  },
  philosophy: {
    title: "Our philosophy",
    points: [
      {
        title: "Mission",
        body: "Make structured investing understandable, accessible, and accountable.",
      },
      {
        title: "Vision",
        body: "An investment experience that earns trust through clarity—not theater.",
      },
      {
        title: "Core values",
        body: "Transparency, restraint, accountability, and respect for risk.",
      },
      {
        title: "Leadership principles",
        body: "Say only what we can support. Prefer process over promises. Improve patiently.",
      },
    ],
  },
  commitment: {
    title: "Long-term commitment",
    body: "We prioritize durable systems and honest customer experience over short-term acquisition tactics. When something is still unfinished—such as final brand assets or counsel-approved legal text—we omit claims rather than invent them.",
  },
  responsibility: {
    title: "Corporate responsibility",
    body: "We take investor trust seriously. That includes clear disclosures, reachable support pathways, careful data handling, and a refusal to fabricate credentials, statistics, or testimonials.",
  },
  timeline: {
    title: "Where we are",
    items: [
      "Certified investment engine and money-movement foundations in place.",
      "Administrative operations certified for responsible platform management.",
      "Public trust experience under construction with an approved design constitution.",
    ],
  },
  cta: {
    title: "Continue with confidence.",
    support: "Explore how the process works, or start when you are ready.",
    primary: { label: "How it works", href: "/how-it-works" },
    secondary: { label: "Get started", href: "/auth/register" },
  },
} as const;

export const HOW_IT_WORKS_COPY = {
  purpose: "Make investing feel simple.",
  hero: {
    eyebrow: "How it works",
    title: "A calm path from account to withdrawal.",
    lead: "Six clear steps. No backend jargon. No pressure—just what to expect along the way.",
  },
  steps: [
    {
      title: "Create account",
      detail: "Register with your details and choose a clear next step.",
    },
    {
      title: "Verify identity",
      detail: "Confirm your email so we know we are reaching the right person.",
    },
    {
      title: "Fund account",
      detail: "Add funds through approved channels. Submissions move through clear review statuses.",
    },
    {
      title: "Choose plan",
      detail: "Activate a published plan when you are ready. Terms come from the certified catalog.",
    },
    {
      title: "Track investment",
      detail: "Follow progress and statuses in your account—quietly and clearly.",
    },
    {
      title: "Receive earnings",
      detail: "When earnings are credited, they appear as accounted activity—not mystery numbers.",
    },
    {
      title: "Withdraw funds",
      detail: "Request a transfer when eligible. Requests follow reviewed statuses until completion.",
    },
  ],
  status: {
    title: "Statuses you may see",
    lead: "Money movement uses plain-language statuses so waiting feels informed—not obscure.",
    items: [
      { label: "Pending / submitted", meaning: "We have received your request." },
      { label: "Under review", meaning: "The request is being checked before the next step." },
      { label: "Confirmed / paid", meaning: "The action completed successfully." },
      { label: "Rejected / failed", meaning: "It could not proceed—support can help you recover." },
    ],
  },
  notes: {
    title: "What to expect",
    funding:
      "Funding is not instantaneous theater. Clear review and confirmation protect both you and the platform.",
    withdrawal:
      "Withdrawals are requested when eligible and then reviewed. Timelines are communicated as expectancy—not guarantees of instant settlement.",
  },
  cta: {
    title: "Ready when you are.",
    support: "Create an account, or read how we protect it.",
    primary: { label: "Get started", href: "/auth/register" },
    secondary: { label: "Security", href: "/security" },
  },
} as const;

export const SECURITY_COPY = {
  purpose: "Answer “Is my money and my account safe?”",
  hero: {
    eyebrow: "Security",
    title: "Protection is a practice—not a slogan.",
    lead: "We explain what we actually do. We do not invent certifications, audits, or guarantees that do not exist.",
  },
  account: {
    title: "Account security",
    items: [
      "Sign-in controls and password recovery designed for calm recovery—not panic.",
      "Email verification before full platform participation.",
      "Session awareness so unfamiliar activity can be noticed and addressed.",
    ],
  },
  auth: {
    title: "Authentication & verification",
    body: "We verify email ownership and support trusted-device and session management so account access stays intentional.",
  },
  funds: {
    title: "Fund protection philosophy",
    body: "Balances are meant to reflect accounted financial activity. Deposits and withdrawals move through review statuses so money movement stays explainable.",
  },
  monitoring: {
    title: "Monitoring & recovery",
    items: [
      "Security-relevant events can notify you when something important changes.",
      "If a request fails, you should receive clear language and a path to try again or contact support.",
      "Administrative review exists for sensitive money operations—visible as status, not hidden drama.",
    ],
  },
  privacy: {
    title: "Data protection & privacy",
    body: "We aim to collect what is needed, expose as little sensitive detail as necessary, and publish clear policy pages as they are counsel-approved.",
  },
  never: {
    title: "What we never do",
    items: [
      "Claim audits, licenses, or certifications we cannot show.",
      "Promise risk-free returns or guaranteed profits.",
      "Use fake urgency, fabricated testimonials, or invented statistics to manufacture trust.",
    ],
  },
  policies: {
    title: "Related policies",
    links: [
      { label: "Privacy", href: "/legal/privacy" },
      { label: "Terms", href: "/legal/terms" },
      { label: "Risk Disclosure", href: "/legal/risk" },
      { label: "AML", href: "/legal/aml" },
      { label: "KYC", href: "/legal/kyc" },
    ],
  },
  cta: {
    title: "Continue carefully—and clearly.",
    support: "If you still have questions, ask. Exploration should feel pressure-free.",
    primary: { label: "Contact", href: "/contact" },
    secondary: { label: "Get started", href: "/auth/register" },
  },
} as const;
