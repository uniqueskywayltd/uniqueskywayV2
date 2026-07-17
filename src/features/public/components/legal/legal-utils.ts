import type { LegalSection } from "@/features/public/content/legal-pages";

export function slugifyLegalHeading(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function estimateReadingMinutes(sections: readonly LegalSection[]): number {
  const words = sections
    .flatMap((section) => section.paragraphs)
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function estimateFaqReadingMinutes(
  items: ReadonlyArray<{ question: string; answer: string }>,
): number {
  const words = items
    .flatMap((item) => [item.question, item.answer])
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}
