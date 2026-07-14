import { FINANCIAL_TIME_ZONE } from "@/config/constants";

export type LearningPathId =
  | "getting-started"
  | "investments"
  | "wallet-transfers"
  | "security"
  | "statements"
  | "referrals";

export interface LearningLesson {
  slug: string;
  title: string;
  question: string;
  summary: string;
  body: string;
  estimatedMinutes: number;
  pathId: LearningPathId;
  relatedSlugs: string[];
  appHref: string | null;
  appHrefLabel: string | null;
  /** Optional; G3 ships text-first (no hosted video required). */
  videoNote: string | null;
}

export interface LearningPath {
  id: LearningPathId;
  title: string;
  description: string;
  lessonSlugs: string[];
}

/** Journey order for “next best lesson” recommendations. */
export const LEARNING_PATHS: LearningPath[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    description: "Orient after sign-in — calmly, without pressure.",
    lessonSlugs: ["welcome-after-sign-in", "available-vs-pending", "security-alerts"],
  },
  {
    id: "investments",
    title: "Understanding Investments",
    description: "Principal, accrued vs credited, and New York settlement expectancy.",
    lessonSlugs: ["accrued-vs-credited", "new-york-settlement", "maturity-clarity"],
  },
  {
    id: "wallet-transfers",
    title: "Wallet & Transfers",
    description: "How deposits and withdrawals feel safe and honest.",
    lessonSlugs: ["deposit-safe", "withdrawal-review", "wallet-vocabulary"],
  },
  {
    id: "security",
    title: "Security",
    description: "Recognize real alerts and protect sessions.",
    lessonSlugs: ["security-alerts", "sessions-and-devices"],
  },
  {
    id: "statements",
    title: "Statements",
    description: "Understand financial history as ledger projections.",
    lessonSlugs: ["statements-understanding", "download-statements"],
  },
  {
    id: "referrals",
    title: "Referrals",
    description: "Share accurately and privately — no pressure.",
    lessonSlugs: ["referrals-responsible"],
  },
];

export const LEARNING_LESSONS: LearningLesson[] = [
  {
    slug: "welcome-after-sign-in",
    title: "What happens after I sign in?",
    question: "Where do I start?",
    summary: "Dashboard answers money today. Success Hub helps you grow over time.",
    body: "After sign-in, Dashboard is your financial home — balances and next money actions. Portfolio shows investments. Wallet moves money. Ledger shows exact postings. The Success Hub answers how to become more successful with learning, statements, and responsible referrals — without inventing balances.",
    estimatedMinutes: 2,
    pathId: "getting-started",
    relatedSlugs: ["available-vs-pending", "security-alerts"],
    appHref: "/dashboard",
    appHrefLabel: "Open dashboard",
    videoNote: null,
  },
  {
    slug: "available-vs-pending",
    title: "Available vs Pending vs Locked",
    question: "What can I use right now?",
    summary: "Available is spendable. Pending is not final. Locked is committed to investments.",
    body: "Your wallet is an operations center. Available equals what you can invest or withdraw. Pending usually means an in-flight deposit. Locked principal stays in investments until a certified unlock event. Never treat Pending as cash you can spend.",
    estimatedMinutes: 3,
    pathId: "getting-started",
    relatedSlugs: ["wallet-vocabulary", "deposit-safe"],
    appHref: "/wallet",
    appHrefLabel: "Open wallet",
    videoNote: null,
  },
  {
    slug: "security-alerts",
    title: "Security alerts come first",
    question: "What should I read before money news?",
    summary: "Account integrity always outranks routine money success notes.",
    body: "If a new device, password change, or security notice appears, address it before routine wallet activity. Sessions and trusted devices live under Account → Security. Marketing and product tips never drown security alerts.",
    estimatedMinutes: 2,
    pathId: "security",
    relatedSlugs: ["sessions-and-devices", "welcome-after-sign-in"],
    appHref: "/account/security",
    appHrefLabel: "Open security",
    videoNote: null,
  },
  {
    slug: "sessions-and-devices",
    title: "Sessions and trusted devices",
    question: "How do I keep my account calm and safe?",
    summary: "Review active sessions and trusted devices regularly.",
    body: "Sign out of sessions you do not recognize. Trusted devices reduce friction but still deserve review after travel or shared computers. Security settings never invent money movement — they protect access to the platforms that do.",
    estimatedMinutes: 3,
    pathId: "security",
    relatedSlugs: ["security-alerts"],
    appHref: "/account/security/sessions",
    appHrefLabel: "Review sessions",
    videoNote: null,
  },
  {
    slug: "accrued-vs-credited",
    title: "Accrued earnings vs credited earnings",
    question: "Why can’t I withdraw accrued amounts?",
    summary: "Accrued is not withdrawable. Credited means it posted to the ledger.",
    body: "Scheduled ROI rows are plans, not wallet cash. Only credited postings change Available. Portfolio shows schedule truth; wallet shows operational cash. If a number is only accrued, it is not yet money you can withdraw.",
    estimatedMinutes: 4,
    pathId: "investments",
    relatedSlugs: ["new-york-settlement", "maturity-clarity"],
    appHref: "/portfolio",
    appHrefLabel: "Open portfolio",
    videoNote: null,
  },
  {
    slug: "new-york-settlement",
    title: "New York settlement days",
    question: "When should I expect settlement language?",
    summary: "Settlement uses America/New_York calendar days — without fake clock guarantees.",
    body: `Expectancy around settlement references New York business days (timezone ${FINANCIAL_TIME_ZONE}). The product never invents guaranteed clock times for postings. When a settlement day completes, credited amounts appear through certified posting — then wallet and ledger update together.`,
    estimatedMinutes: 3,
    pathId: "investments",
    relatedSlugs: ["accrued-vs-credited", "maturity-clarity"],
    appHref: "/portfolio",
    appHrefLabel: "Open portfolio",
    videoNote: null,
  },
  {
    slug: "maturity-clarity",
    title: "How maturity is shown",
    question: "What happens when an investment matures?",
    summary: "Maturity is a plain outcome with ledger links — not a celebration stunt.",
    body: "When an investment reaches maturity, status language stays calm and exact. Principal handling follows certified rules and appears in portfolio and ledger. Soft confirmation only — never confetti that hides remaining actions.",
    estimatedMinutes: 3,
    pathId: "investments",
    relatedSlugs: ["accrued-vs-credited", "statements-understanding"],
    appHref: "/portfolio",
    appHrefLabel: "Open portfolio",
    videoNote: null,
  },
  {
    slug: "deposit-safe",
    title: "How deposits become Available",
    question: "What happens after I start a deposit?",
    summary: "Deposits feel safe — not rushed. Funds credit after confirmation.",
    body: "Create a deposit, complete the provider step, then wait for confirmation. Confirmed deposits post to the ledger and appear as Available. Failed or cancelled deposits do not invent balance. Status timelines explain the next step without urgency theater.",
    estimatedMinutes: 3,
    pathId: "wallet-transfers",
    relatedSlugs: ["available-vs-pending", "withdrawal-review"],
    appHref: "/wallet/deposits/new",
    appHrefLabel: "Start a deposit",
    videoNote: null,
  },
  {
    slug: "withdrawal-review",
    title: "What “Withdrawal in review” means",
    question: "Why is my withdrawal waiting?",
    summary: "Review is normal. Know status, next step, expectancy, and support.",
    body: "A withdrawal reserves funds so they cannot be spent twice. Review may occur before payout. Processing uses the certified provider. Paid means the payout completed; confirm receipt at your destination. Anxiety paths always show next step and support — never false ETAs.",
    estimatedMinutes: 4,
    pathId: "wallet-transfers",
    relatedSlugs: ["deposit-safe", "wallet-vocabulary"],
    appHref: "/wallet/withdrawals",
    appHrefLabel: "View withdrawals",
    videoNote: null,
  },
  {
    slug: "wallet-vocabulary",
    title: "Wallet vocabulary that stays honest",
    question: "Which wallet words should I trust?",
    summary: "Available, Pending, Locked, Reserved, Withdrawable — each means something precise.",
    body: "Use the wallet vocabulary tips on the wallet page. Accrued is not a wallet bucket. Reserved means money is held for an open withdrawal. Withdrawable tracks what you can request now under current rules. If a label is unclear, open Help or Learning — never guess from marketing copy.",
    estimatedMinutes: 3,
    pathId: "wallet-transfers",
    relatedSlugs: ["available-vs-pending", "deposit-safe"],
    appHref: "/wallet",
    appHrefLabel: "Open wallet",
    videoNote: null,
  },
  {
    slug: "statements-understanding",
    title: "Can I understand my financial history?",
    question: "What are statements for?",
    summary: "Statements project posted ledger activity by New York month — they are not a second ledger.",
    body: "Open Statements from Success Hub. Pick a period, read the summary, then the lines. Period net activity is not your Available balance. Totals match listed ledger lines for that month. Pending wallet items may appear on wallet before they post to statements.",
    estimatedMinutes: 3,
    pathId: "statements",
    relatedSlugs: ["download-statements", "accrued-vs-credited"],
    appHref: "/account/statements",
    appHrefLabel: "Open statements",
    videoNote: null,
  },
  {
    slug: "download-statements",
    title: "How to download a statement",
    question: "How do I keep a copy?",
    summary: "Preview on screen first, then download CSV with the same totals.",
    body: "Open a statement, confirm the period and timezone, then Download CSV. The file contains the same projected lines you see on screen. Downloads are recorded quietly for your history. Print is available for a paper copy. Statements are not tax advice.",
    estimatedMinutes: 2,
    pathId: "statements",
    relatedSlugs: ["statements-understanding"],
    appHref: "/account/statements",
    appHrefLabel: "Open statements",
    videoNote: null,
  },
  {
    slug: "referrals-responsible",
    title: "How do I recommend this responsibly?",
    question: "How should I share Unique Sky Way?",
    summary: "Privacy-first. Accurate claims only. No pressure UX.",
    body: "Use your referral code or link from the referrals page. Share honest product language — never invent guaranteed returns. Referral rewards become wallet money only when credited through the ledger. You will not see other people’s balances. There are no streaks or invite walls.",
    estimatedMinutes: 3,
    pathId: "referrals",
    relatedSlugs: ["welcome-after-sign-in"],
    appHref: "/account/referrals",
    appHrefLabel: "Open referrals",
    videoNote: null,
  },
];

export function getLesson(slug: string): LearningLesson | undefined {
  return LEARNING_LESSONS.find((lesson) => lesson.slug === slug);
}

export function getPath(pathId: LearningPathId): LearningPath | undefined {
  return LEARNING_PATHS.find((path) => path.id === pathId);
}

export function recommendationOrder(): string[] {
  const seen = new Set<string>();
  const order: string[] = [];
  for (const path of LEARNING_PATHS) {
    for (const slug of path.lessonSlugs) {
      if (!seen.has(slug)) {
        seen.add(slug);
        order.push(slug);
      }
    }
  }
  return order;
}

export function searchLearningCatalog(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return {
      paths: LEARNING_PATHS,
      lessons: LEARNING_LESSONS,
    };
  }

  const paths = LEARNING_PATHS.filter((path) => {
    const haystack = `${path.title} ${path.description}`.toLowerCase();
    return haystack.includes(normalized);
  });

  const lessons = LEARNING_LESSONS.filter((lesson) => {
    const haystack =
      `${lesson.title} ${lesson.question} ${lesson.summary} ${lesson.body} ${lesson.pathId}`.toLowerCase();
    return haystack.includes(normalized);
  });

  return { paths, lessons };
}

export function recommendNextLesson(completedSlugs: ReadonlyArray<string>): LearningLesson | null {
  const completed = new Set(completedSlugs);
  for (const slug of recommendationOrder()) {
    if (!completed.has(slug)) {
      return getLesson(slug) ?? null;
    }
  }
  return null;
}
