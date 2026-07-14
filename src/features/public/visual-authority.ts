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
 * defects, ADRs, or accessibility fixes — next migration surface is Wallet.
 */
export const VISUAL_AUTHORITY = {
  homepageMigration: "complete",
  homepageFreezeTag: "homepage-migration-complete",
  dashboardMigration: "complete",
  dashboardCommit: "f436f2e",
  visualSpecRoot: "uniqueskyway/platform",
  implementationRoot: "uniqueskywayV2",
  phpStatus: "historical-reference-only",
  nextSurfaces: [
    "customer wallet (platform dashboard/wallet visuals → V3 /wallet)",
    "customer portfolio",
    "admin (platform hard/auth portal)",
    "auth / empty / error states (platform auth, errors, brand)",
  ],
} as const;
