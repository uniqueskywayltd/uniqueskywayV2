/**
 * Sprint A5 — Legal suite content.
 *
 * Classification:
 * - fact: aligned to certified platform behavior / published process
 * - placeholder: structure present; entity specifics pending lock
 * - counsel: requires legal counsel final approval before treating as binding
 */

export type LegalClassification = "fact" | "placeholder" | "counsel";

export type LegalSection = {
  title: string;
  classification: LegalClassification;
  paragraphs: string[];
};

export const LEGAL_BANNER = {
  title: "Subject to legal counsel review",
  body: "This page outlines Unique Sky Way’s intended policy posture. Binding legal text requires final counsel approval. Until then, treat content as informational draft—not a substitute for certified counsel-approved terms.",
} as const;

export const LEGAL_PAGES = {
  privacy: {
    path: "/legal/privacy",
    title: "Privacy Policy",
    description:
      "How Unique Sky Way intends to collect, use, share, and retain personal data—subject to legal counsel review.",
    purpose: "Explain data practices without fabricating commitments.",
    lead: "We describe practices honestly. Where details depend on counsel or entity lock, we mark them clearly.",
    sections: [
      {
        title: "What this policy covers",
        classification: "counsel",
        paragraphs: [
          "This draft addresses personal information related to account registration, verification, support contact, and platform use.",
          "Final scope, jurisdiction language, and controller identity are pending legal counsel approval and entity lock.",
        ],
      },
      {
        title: "Information we may collect",
        classification: "fact",
        paragraphs: [
          "Account details you provide during registration and profile management (for example name and email).",
          "Security-related signals such as session and trusted-device activity used to protect account access.",
          "Support messages submitted through the public contact intake.",
        ],
      },
      {
        title: "How we use information",
        classification: "fact",
        paragraphs: [
          "To operate accounts, authenticate users, and provide customer and administrative experiences.",
          "To process money-movement and investment activity according to certified platform rules.",
          "To respond to support requests and improve clarity of the product experience.",
        ],
      },
      {
        title: "Sharing",
        classification: "counsel",
        paragraphs: [
          "We do not sell personal information.",
          "Service providers (for example email delivery or payment processors) may process data only as needed to operate the platform.",
          "Detailed processor lists and cross-border transfer clauses require counsel-approved schedules.",
        ],
      },
      {
        title: "Retention",
        classification: "placeholder",
        paragraphs: [
          "Retention periods will follow operational need, security, and regulatory requirements once counsel finalizes the schedule.",
          "Until that schedule is published, we retain what is necessary to operate accounts and financial records responsibly.",
        ],
      },
      {
        title: "Your rights",
        classification: "counsel",
        paragraphs: [
          "Depending on applicable law, you may have rights to access, correct, or delete certain personal information.",
          "How to exercise those rights—and any exceptions—will be confirmed in the counsel-approved policy.",
        ],
      },
      {
        title: "Contact for privacy questions",
        classification: "placeholder",
        paragraphs: [
          "Public privacy inbox and formal notice addresses are pending approval. Use the Contact page intake until those channels are published.",
        ],
      },
    ] satisfies LegalSection[],
  },
  terms: {
    path: "/legal/terms",
    title: "Terms & Conditions",
    description:
      "Platform rules for Unique Sky Way accounts, investments, and money movement—subject to legal counsel review.",
    purpose: "Set platform participation expectations without inventing legal guarantees.",
    lead: "These terms describe how the platform is designed to operate. Counsel must approve binding language before public enforceability claims.",
    sections: [
      {
        title: "Agreement status",
        classification: "counsel",
        paragraphs: [
          "This document is a working draft of platform terms. It is not final counsel-approved Terms of Service.",
        ],
      },
      {
        title: "Eligibility",
        classification: "fact",
        paragraphs: [
          "You must provide accurate registration details and complete email verification before full participation.",
          "Additional verification may be required for certain activities according to platform policy.",
        ],
      },
      {
        title: "Accounts",
        classification: "fact",
        paragraphs: [
          "You are responsible for safeguarding sign-in credentials and reviewing session or trusted-device activity.",
          "Account status changes and security events are handled through certified authentication flows.",
        ],
      },
      {
        title: "Investments",
        classification: "fact",
        paragraphs: [
          "Investment plan terms come from the certified investment catalog and engine when published.",
          "The public website does not invent ROI math. Returns are not guaranteed.",
        ],
      },
      {
        title: "Deposits and withdrawals",
        classification: "fact",
        paragraphs: [
          "Funding and withdrawals move through reviewed statuses in the certified money-movement system.",
          "Submission does not mean instant confirmation. Timelines are expectancy, not guarantees of immediate settlement.",
        ],
      },
      {
        title: "Referrals",
        classification: "placeholder",
        paragraphs: [
          "Referral and growth programs, if offered later, will be governed by separately published rules. No referral program terms are asserted here.",
        ],
      },
      {
        title: "Liability and disputes",
        classification: "counsel",
        paragraphs: [
          "Limitation of liability, governing law, and dispute procedures require legal counsel drafting and approval.",
          "Until approved, do not rely on this draft for jurisdictional or damages conclusions.",
        ],
      },
    ] satisfies LegalSection[],
  },
  risk: {
    path: "/legal/risk",
    title: "Risk Disclosure",
    description:
      "Important risks related to investing through Unique Sky Way—read before registering or activating a plan.",
    purpose: "Make investment risk clear without melodrama or false reassurance.",
    lead: "Investments involve risk, including possible loss of capital. Nothing on this platform guarantees profit.",
    sections: [
      {
        title: "No guarantee of returns",
        classification: "fact",
        paragraphs: [
          "Past or illustrative returns are not a promise of future performance.",
          "The platform never presents risk-free investing or guaranteed wealth.",
        ],
      },
      {
        title: "Market and strategy risk",
        classification: "counsel",
        paragraphs: [
          "Investment outcomes can vary based on market, operational, and plan-specific factors.",
          "Counsel-approved wording will refine the formal risk taxonomy for published plans.",
        ],
      },
      {
        title: "Operational and process risk",
        classification: "fact",
        paragraphs: [
          "Deposits, withdrawals, and plan activity depend on verification, review statuses, and settlement processes.",
          "Delays, rejections, or recovery steps may occur. Status language is designed to keep waiting informed.",
        ],
      },
      {
        title: "Liquidity and review timelines",
        classification: "fact",
        paragraphs: [
          "Eligibility to withdraw depends on account and plan state under certified platform rules.",
          "Review timelines are communicated as expectancy—not instant settlement guarantees.",
        ],
      },
      {
        title: "Your responsibility",
        classification: "fact",
        paragraphs: [
          "Only invest funds you can afford to put at risk. Read plan terms carefully before activation.",
          "Ask questions via Contact if anything remains unclear.",
        ],
      },
    ] satisfies LegalSection[],
  },
  aml: {
    path: "/legal/aml",
    title: "AML Policy",
    description:
      "Unique Sky Way’s anti-money-laundering posture—customer due diligence, monitoring, and escalation.",
    purpose: "State AML posture without empty compliance theater.",
    lead: "We maintain processes intended to reduce misuse of the platform. We do not invent certifications we cannot show.",
    sections: [
      {
        title: "Purpose",
        classification: "counsel",
        paragraphs: [
          "This draft describes intended anti-money-laundering posture. Formal policy ownership and jurisdictional statements require counsel approval.",
        ],
      },
      {
        title: "Customer due diligence",
        classification: "fact",
        paragraphs: [
          "Account verification and identity checks may be required before sensitive activity proceeds.",
          "Administrative review exists for money-movement operations where risk warrants human oversight.",
        ],
      },
      {
        title: "Monitoring",
        classification: "fact",
        paragraphs: [
          "Unusual or high-risk activity may be reviewed and may result in delay, rejection, or account restrictions according to platform rules.",
        ],
      },
      {
        title: "Escalation",
        classification: "placeholder",
        paragraphs: [
          "Internal escalation and regulatory reporting pathways will be finalized with counsel and operations.",
          "Until published, staff follow internal administrative procedures without public claim of regulator-specific filings.",
        ],
      },
      {
        title: "What we never claim",
        classification: "fact",
        paragraphs: [
          "We do not display fake AML certificates, auditor logos, or regulator endorsements.",
        ],
      },
    ] satisfies LegalSection[],
  },
  kyc: {
    path: "/legal/kyc",
    title: "KYC Policy",
    description:
      "Identity verification expectations on Unique Sky Way—when checks may be required and what outcomes mean.",
    purpose: "Set KYC expectations without inventing document theater.",
    lead: "Know-Your-Customer checks protect accounts and the platform. Customer self-serve KYC UX may expand in later waves.",
    sections: [
      {
        title: "When verification may be required",
        classification: "fact",
        paragraphs: [
          "Email verification is required for full participation.",
          "Additional identity checks may be required for certain money or account activities.",
        ],
      },
      {
        title: "Documents and review",
        classification: "placeholder",
        paragraphs: [
          "Specific document lists and upload experiences will be published when customer KYC UX is released.",
          "Administrative KYC review capabilities exist for staff operations; public claims stay limited to what ships.",
        ],
      },
      {
        title: "Outcomes",
        classification: "fact",
        paragraphs: [
          "Verification may be approved, require more information, or be declined according to policy.",
          "Clear status language is preferred over silent blocking.",
        ],
      },
      {
        title: "Counsel review",
        classification: "counsel",
        paragraphs: [
          "Formal KYC obligations by jurisdiction require legal counsel confirmation before this page is treated as binding policy.",
        ],
      },
    ] satisfies LegalSection[],
  },
  cookies: {
    path: "/legal/cookies",
    title: "Cookie Policy",
    description:
      "How Unique Sky Way uses cookies and similar technologies—essential categories first.",
    purpose: "Explain cookie use without inventing analytics commitments.",
    lead: "We describe categories we actually use. Preference tooling for non-essential cookies will appear when those cookies exist.",
    sections: [
      {
        title: "Essential cookies",
        classification: "fact",
        paragraphs: [
          "Essential cookies and similar storage may be used for authentication, security, and core site function.",
          "These are required for the product to work as designed.",
        ],
      },
      {
        title: "Analytics and marketing",
        classification: "placeholder",
        paragraphs: [
          "If non-essential analytics or marketing cookies are introduced later, categories and a preference control will be published here first.",
          "We do not claim an analytics stack we have not shipped.",
        ],
      },
      {
        title: "Managing preferences",
        classification: "placeholder",
        paragraphs: [
          "Browser controls can clear cookies. In-product preference management will link from this page when non-essential cookies require consent UI.",
        ],
      },
      {
        title: "Counsel review",
        classification: "counsel",
        paragraphs: [
          "Regional consent language and retention details require counsel approval before final publish.",
        ],
      },
    ] satisfies LegalSection[],
  },
} as const;

export type LegalPageKey = keyof typeof LEGAL_PAGES;
