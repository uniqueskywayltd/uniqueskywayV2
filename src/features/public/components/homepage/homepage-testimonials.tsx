"use client";

import { Quote } from "lucide-react";

import { useI18n } from "@/features/i18n/i18n-provider";
import { section } from "@/features/public/components/marketing-ui";
import { PLATFORM_TESTIMONIALS, type Testimonial } from "@/features/public/content/testimonials";
import { cn } from "@/lib/utils";

function TestimonialCard({ item }: { item: Testimonial }) {
  return (
    <article
      className={cn(
        "w-[min(100vw-2rem,22rem)] shrink-0 overflow-hidden rounded-xl border p-6 shadow-md sm:w-[24rem] sm:p-7",
        "border-slate-200/90 bg-white text-slate-900 shadow-slate-900/8 ring-1 ring-slate-900/5",
        "dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:shadow-black/40 dark:ring-white/10",
      )}
    >
      <Quote className="h-5 w-5 text-sky-600 dark:text-sky-400" aria-hidden />
      <blockquote className="mt-3 text-sm leading-relaxed font-medium text-slate-800 sm:text-base dark:text-slate-100">
        &ldquo;{item.quote}&rdquo;
      </blockquote>
      <footer className="mt-6 border-t border-slate-200 pt-4 dark:border-slate-700">
        <cite className="not-italic">
          <p className="font-semibold text-slate-900 dark:text-white">{item.name}</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {item.occupation} · {item.location}
          </p>
        </cite>
      </footer>
    </article>
  );
}

export function HomepageTestimonials() {
  const { t } = useI18n();
  const track = [...PLATFORM_TESTIMONIALS, ...PLATFORM_TESTIMONIALS];

  return (
    <section
      className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950"
      aria-label="Client testimonials"
    >
      <div className={cn(section.container, section.padding)}>
        <div className="max-w-2xl">
          <p className="text-xs font-semibold tracking-[0.14em] text-sky-700 uppercase dark:text-sky-400">
            {t("home.testimonials.eyebrow")}
          </p>
          <h2 className="mt-3 text-3xl leading-[1.15] font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            {t("home.testimonials.title")}
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-700 dark:text-slate-300">
            {t("home.testimonials.body")}
          </p>
        </div>

        <div className="relative mt-12 overflow-hidden lg:mt-14" aria-label="Scrolling testimonials">
          <div className="animate-testimonials-marquee flex w-max gap-4 sm:gap-5">
            {track.map((item, index) => (
              <TestimonialCard key={`${item.name}-${index}`} item={item} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
