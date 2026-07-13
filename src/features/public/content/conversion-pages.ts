/**
 * Sprint A4 — Conversion Layer content.
 * Plans use certified-catalog placeholders only — no frontend ROI math.
 */

export const PLANS_COPY = {
  purpose: "Help customers understand available investment opportunities.",
  hero: {
    eyebrow: "Investment plans",
    title: "Compare with clarity.",
    lead: "Plan terms come from the certified investment catalog when published. Until then, we show honest placeholders—never invented returns.",
  },
  howTermsWork: {
    title: "How plan terms work",
    body: "When a plan is published, its duration, eligibility, and earning rules are defined by the certified investment engine. The public site presents those terms; it does not calculate returns in the browser.",
  },
  lifecycle: {
    title: "Plan lifecycle (high level)",
    steps: [
      {
        title: "Choose",
        detail: "Review published plans and select one that matches your timing and capacity.",
      },
      {
        title: "Activate",
        detail: "After funding eligibility is met, activate within your account following platform rules.",
      },
      {
        title: "Track",
        detail: "Follow statuses and accounted activity as the plan progresses.",
      },
      {
        title: "Complete",
        detail: "When the term concludes, eligible balances follow certified settlement behavior.",
      },
    ],
  },
  eligibility: {
    title: "Eligibility",
    items: [
      "Verified account (email confirmation complete).",
      "Sufficient available balance for the plan’s published minimum, when shown.",
      "Plan status must be available for activation—not every listing is always open.",
    ],
  },
  catalog: {
    title: "Featured plans",
    emptyTitle: "Plans will appear when published",
    emptyDescription:
      "These comparison cards are ready for the certified plans contract. Nothing here fabricates ROI, rates, or guarantees.",
    placeholders: [
      {
        name: "Featured plan",
        duration: "Duration from certified catalog",
        eligibility: "Eligibility from certified catalog",
        earnings: "Earnings follow certified engine terms",
        status: "Awaiting publish",
      },
      {
        name: "Featured plan",
        duration: "Duration from certified catalog",
        eligibility: "Eligibility from certified catalog",
        earnings: "Earnings follow certified engine terms",
        status: "Awaiting publish",
      },
      {
        name: "Featured plan",
        duration: "Duration from certified catalog",
        eligibility: "Eligibility from certified catalog",
        earnings: "Earnings follow certified engine terms",
        status: "Awaiting publish",
      },
    ],
  },
  risk: {
    title: "Risk note",
    body: "Investments involve risk, including possible loss of capital. Returns are not guaranteed. Read the Risk Disclosure before registering.",
    href: "/legal/risk",
    label: "Risk Disclosure",
  },
  cta: {
    title: "Ready to begin?",
    support: "Create an account when you are ready. There is no countdown and no manufactured scarcity.",
    primary: { label: "Get started", href: "/auth/register" },
    secondary: { label: "How it works", href: "/how-it-works" },
  },
} as const;

export const FAQ_CATEGORIES = [
  "Getting Started",
  "Investments",
  "Deposits",
  "Withdrawals",
  "Security",
  "Verification",
  "Accounts",
  "Support",
] as const;

export type FaqCategory = (typeof FAQ_CATEGORIES)[number];

export type FaqItem = {
  category: FaqCategory;
  question: string;
  answer: string;
};

export const FAQ_COPY = {
  purpose: "Remove objections.",
  hero: {
    eyebrow: "FAQ",
    title: "Answers without the noise.",
    lead: "Plain language aligned to certified platform behavior. If something is not built yet, we say so.",
  },
  searchPlaceholder: "Search questions…",
  empty: "No questions match that search. Try another phrase, or contact us.",
  items: [
    {
      category: "Getting Started",
      question: "How do I create an account?",
      answer:
        "Use Get started to register with your details, then verify your email before full participation.",
    },
    {
      category: "Getting Started",
      question: "Do I need to decide a plan immediately?",
      answer:
        "No. You can explore How it works, Security, and Plans first. Registration does not force an investment.",
    },
    {
      category: "Investments",
      question: "Are returns guaranteed?",
      answer:
        "No. Investments involve risk, including possible loss of capital. Always read the Risk Disclosure.",
    },
    {
      category: "Investments",
      question: "Where do plan terms come from?",
      answer:
        "Published plan terms come from the certified investment catalog and engine. The public site does not invent or recalculate ROI.",
    },
    {
      category: "Investments",
      question: "Can I compare plans before registering?",
      answer:
        "Yes. The Plans page is designed for comparison. Featured listings appear when the certified catalog is published.",
    },
    {
      category: "Deposits",
      question: "How do deposits work?",
      answer:
        "You submit funding through approved channels. Deposits move through clear review statuses before confirmation—not instantaneous theater.",
    },
    {
      category: "Deposits",
      question: "Will I see a status after I fund?",
      answer:
        "Yes. Expect plain-language statuses such as pending/submitted, under review, confirmed, or failed—so waiting stays informed.",
    },
    {
      category: "Withdrawals",
      question: "How do withdrawals work?",
      answer:
        "When eligible, you request a transfer. Requests follow reviewed statuses until completion. Timelines are expectancy—not guarantees of instant settlement.",
    },
    {
      category: "Withdrawals",
      question: "Can every balance be withdrawn immediately?",
      answer:
        "Eligibility depends on account state and certified platform rules. The product surfaces eligibility clearly rather than inventing shortcuts.",
    },
    {
      category: "Security",
      question: "How do you protect my account?",
      answer:
        "Sign-in controls, email verification, and session awareness. See Security for human-readable detail—without invented audit badges.",
    },
    {
      category: "Security",
      question: "Do you claim external security certifications?",
      answer:
        "Only if we can show them. We never invent ISO, SOC, or similar badges to manufacture trust.",
    },
    {
      category: "Verification",
      question: "Why do you verify email?",
      answer:
        "So we know we are reaching the right person before sensitive account or money activity continues.",
    },
    {
      category: "Verification",
      question: "Is deeper identity verification required?",
      answer:
        "Platform policy may require additional checks for certain actions. When required, we explain the step—we do not invent KYC theater on this page.",
    },
    {
      category: "Accounts",
      question: "Can I manage sessions and devices?",
      answer:
        "Yes. Authenticated account settings include session and trusted-device management so access stays intentional.",
    },
    {
      category: "Accounts",
      question: "What if I forget my password?",
      answer:
        "Use the password recovery flow from Sign in. Recovery is designed to be calm—not alarming.",
    },
    {
      category: "Support",
      question: "How do I reach Unique Sky Way?",
      answer:
        "Use the Contact page. Channels marked pending are not invented—use the form intake, and we publish approved channels when ready.",
    },
    {
      category: "Support",
      question: "What is the expected response time?",
      answer:
        "We aim to respond within 1–2 business days once the support channel is active. Urgent product questions are often answered in FAQ first.",
    },
  ] satisfies FaqItem[],
  cta: {
    title: "Still unsure?",
    support: "Ask a human question—or continue when you feel ready.",
    primary: { label: "Contact", href: "/contact" },
    secondary: { label: "Get started", href: "/auth/register" },
  },
} as const;

export const CONTACT_COPY = {
  purpose: "Make the company feel reachable.",
  hero: {
    eyebrow: "Contact",
    title: "Ask clearly. We answer calmly.",
    lead: "Reach Unique Sky Way without pressure. Channels that are not approved yet are marked pending—never invented.",
  },
  channels: {
    title: "Channels",
    items: [
      {
        label: "Email",
        value: "Pending approval",
        status: "pending" as const,
        note: "Support inbox publish when counsel/ops approve the public address.",
      },
      {
        label: "Phone",
        value: "Pending approval",
        status: "pending" as const,
        note: "No public phone number until an approved line exists.",
      },
      {
        label: "Office address",
        value: "Pending approval",
        status: "pending" as const,
        note: "We will not invent an address or plaque for prestige.",
      },
    ],
  },
  expectations: {
    title: "What to expect",
    hours: "Business hours: Monday–Friday (America/New_York), excluding public holidays — pending formal publish confirmation.",
    response:
      "Expected response time: within 1–2 business days after your message is received by the support intake.",
    topics: "Use the form for questions about accounts, plans, deposits, withdrawals, or diligence.",
  },
  form: {
    title: "Send a message",
    nameLabel: "Full name",
    emailLabel: "Email",
    topicLabel: "Topic",
    messageLabel: "Message",
    submitLabel: "Send message",
    topics: [
      "General question",
      "Plans",
      "Deposits & withdrawals",
      "Account & security",
      "Diligence / partnership",
      "Other",
    ],
    successTitle: "Message received.",
    successBody:
      "Thank you. Your submission was validated and accepted by our contact intake. We aim to respond within 1–2 business days once the support channel is fully active.",
    errorBody: "We could not accept that submission. Please check the fields and try again.",
    honeypotLabel: "Company website",
  },
  cta: {
    title: "Prefer self-serve first?",
    support: "Many questions are answered in FAQ—without waiting.",
    primary: { label: "View FAQ", href: "/faq" },
    secondary: { label: "Get started", href: "/auth/register" },
  },
} as const;
