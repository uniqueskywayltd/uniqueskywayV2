/**
 * Visual & implementation authority (post homepage-migration-complete).
 *
 * Hierarchy (do not invert):
 *
 * 1. Visual specification (look & feel):
 *    `/Users/stanlex/Documents/uniqueskyway/platform`
 *    → Current uniqueskyway.com Next.js rebuild (MarketingLayout, HeroSection,
 *      dashboard shells, admin under `hard/auth`, brand WebPs, design-system).
 *
 * 2. Implementation authority (code & product truth):
 *    This repository (`uniqueskywayV2`)
 *    → Architecture, APIs, engines, ledger, auth, admin, customer, i18n.
 *
 * 3. Historical reference only:
 *    `/Users/stanlex/Documents/uniqueskyway/index.php` and sibling PHP/HTML
 *    → Do NOT drive new visual decisions. HP1–HP6 already froze the public
 *      homepage reconstruction that used PHP as interim visual parity.
 *
 * Rebuild visuals in Next/React/Tailwind here. Never copy PHP/HTML/CSS/JS,
 * APIs, auth, payments, or financial logic from either external tree.
 *
 * Homepage status: frozen (`homepage-migration-complete`). Prefer the platform
 * marketing homepage composition for any future public visual changes.
 *
 * Customer dashboard status: frozen (DP1–DP5). Further dashboard work only for
 * defects, ADRs, or accessibility fixes.
 *
 * Customer wallet status: frozen (WP1–WP5). Further wallet work only for
 * defects, ADRs, or accessibility fixes. Wallet is an operations center, not
 * an accounting engine.
 *
 * Customer portfolio status: frozen (PF1–PF5). Further portfolio work only for
 * defects, ADRs, or accessibility fixes. Portfolio explains investments; it
 * does not evaluate them. Certified dates only — never client-derived.
 *
 * Launch polish (LP1): baseline. Unified DashboardShell money chrome (incl.
 * Ledger), #main-content skip target, FX illustrative disclaimer. Further
 * shared-shell work only for defects or accessibility.
 *
 * Profile & Security: frozen. Account controls on DashboardShell — profile,
 * preferences, password, devices, sessions, certified security activity.
 * Further work only for defects, ADRs, or accessibility fixes. No fake 2FA.
 *
 * Notifications & Communication: frozen. Notification Center, Activity,
 * Communication Center, What’s New, and Help on DashboardShell — certified
 * notification/activity read models only. No announcement engine.
 *
 * Admin Visual Polish: frozen. Admin console chrome (shell, nav, tables,
 * overview) matched to platform admin under presentation-only constraints.
 * Further admin work only for defects, ADRs, or accessibility fixes.
 *
 * Visual Parity Completion: frozen (final visual migration baseline). Whole-app
 * presentation aligned with platform authority while preserving certified V2
 * architecture. Further UI only for confirmed bugs, screenshot-backed polish,
 * product decisions, accessibility, or responsive defects. No speculative
 * redesign. Next major train: v3.3.0 International Platform.
 *
 * Launch Candidate LC1: Architecture complete, visual migration complete,
 * feature complete for the certified V2 platform. Additive work only from here
 * (internationalization, refinements). Immutable git reference:
 * `release/v3.2-final`.
 */
export const VISUAL_AUTHORITY = {
  homepageMigration: "complete",
  homepageFreezeTag: "homepage-migration-complete",
  dashboardMigration: "complete",
  dashboardCommit: "f436f2e",
  walletMigration: "complete",
  walletFreezeCommit: "c4a9629",
  portfolioMigration: "complete",
  portfolioFreezeCommit: "cebb0b7",
  launchPolish: "complete",
  launchPolishCommit: "9fc1033",
  profileSecurityMigration: "complete",
  profileSecurityFreezeCommit: "46ae5dd",
  notificationsCommunicationMigration: "complete",
  notificationsCommunicationFreezeCommit: "864a63d",
  adminVisualMigration: "complete",
  adminVisualFreezeCommit: "1cf302d",
  visualParityCompletion: "complete",
  visualParityCompletionFreezeCommit: "f461660",
  launchCandidate: "LC1",
  launchCandidateReleaseBranch: "release/v3.2-final",
  visualSpecRoot: "uniqueskyway/platform",
  implementationRoot: "uniqueskywayV2",
  phpStatus: "historical-reference-only",
  nextSurfaces: [
    "v3.3.0 international platform (i18n, RTL, locale formatting)",
    "screenshot-backed defects only",
  ],
} as const;
