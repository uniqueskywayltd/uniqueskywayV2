import manifest from "../../../public/brand/manifest.json";

type BrandManifest = typeof manifest;

const BASE = manifest.basePath;

function brandFile(relative: string): string {
  if (relative.startsWith("/")) return relative;
  return `${BASE}/${relative}`;
}

/**
 * Single source of truth for Unique Sky Way brand assets.
 * Paths come from `public/brand/manifest.json` — do not hardcode `/brand/...` elsewhere.
 */
export const brandAssets = {
  logos: {
    /** Dark-colored logo for light backgrounds. */
    onLight: brandFile(manifest.logos.onLight),
    /** Light-colored logo for dark backgrounds. */
    onDark: brandFile(manifest.logos.onDark),
  },
  footer: {
    onLight: brandFile(manifest.footer.onLight),
    onDark: brandFile(manifest.footer.onDark),
  },
  icon: brandFile(manifest.icon),
  iconSvg: brandFile(manifest.iconSvg),
  favicon: brandFile(manifest.favicon),
  ogImage: brandFile(manifest.ogImage),
  hero: {
    slides: [...manifest.hero.slides] as string[],
  },
  about: {
    banking: brandFile(manifest.about.banking),
    about1: brandFile(manifest.about.about1),
    about2: brandFile(manifest.about.about2),
  },
  projects: {
    nfts: brandFile(manifest.projects.nfts),
    realEstate: brandFile(manifest.projects.realEstate),
    realWorldAsset: brandFile(manifest.projects.realWorldAsset),
    corporate: brandFile(manifest.projects.corporate),
    financialInitiatives: brandFile(manifest.projects.financialInitiatives),
    naturalEnergy: brandFile(manifest.projects.naturalEnergy),
    financialLoan: brandFile(manifest.projects.financialLoan),
    crypto: brandFile(manifest.projects.crypto),
    agriculture: brandFile(manifest.projects.agriculture),
    financialGrant: brandFile(manifest.projects.financialGrant),
    awardPhoto: brandFile(manifest.projects.awardPhoto),
    awardIcon: brandFile(manifest.projects.awardIcon),
    pattern: brandFile(manifest.projects.pattern),
  },
  plans: {
    cardBackground: brandFile(manifest.plans.cardBackground),
    certificate: brandFile(manifest.plans.certificate),
  },
  videos: {
    english: brandFile(manifest.videos.english),
    spanish: brandFile(manifest.videos.spanish),
  },
  support: brandFile(manifest.support),
  testimonialsBackground: brandFile(manifest.testimonialsBackground),
  emptyStates: {
    default: brandFile(manifest.emptyStates.default),
    meeting: brandFile(manifest.emptyStates.meeting),
    portfolio: brandFile(manifest.emptyStates.portfolio),
    security: brandFile(manifest.emptyStates.security),
    strategy: brandFile(manifest.emptyStates.strategy),
    trust: brandFile(manifest.emptyStates.trust),
  },
  unused: [...manifest.unused] as string[],
} as const;

export type BrandLogoSurface = "onLight" | "onDark";

export function brandLogo(surface: BrandLogoSurface = "onLight"): string {
  return brandAssets.logos[surface];
}

export function brandManifest(): BrandManifest {
  return manifest;
}
