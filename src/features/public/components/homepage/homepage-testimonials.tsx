import { Quote } from "lucide-react";

import { section } from "@/features/public/components/marketing-ui";
import { PLATFORM_TESTIMONIALS, type Testimonial } from "@/features/public/content/testimonials";
import { cn } from "@/lib/utils";

function TestimonialCard({ item }: { item: Testimonial }) {
  return (
    <article
      className={cn(
        "w-[min(100vw-2rem,22rem)] shrink-0 overflow-hidden rounded-xl border border-slate-200/90 bg-white p-6 text-slate-900 shadow-md shadow-slate-900/8 ring-1 ring-slate-900/5 sm:w-[24rem] sm:p-7 dark:border-border dark:bg-card dark:text-foreground dark:shadow-sm dark:ring-border/50",
      )}
    >
      <Quote className="h-5 w-5 text-primary/70" aria-hidden />
      <blockquote className="mt-3 text-sm leading-relaxed font-medium text-foreground sm:text-base">
        &ldquo;{item.quote}&rdquo;
      </blockquote>
      <footer className="mt-6 border-t border-border pt-4">
        <cite className="not-italic">
          <p className="font-semibold text-foreground">{item.name}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {item.occupation} · {item.location}
          </p>
        </cite>
      </footer>
    </article>
  );
}

export function HomepageTestimonials() {
  const track = [...PLATFORM_TESTIMONIALS, ...PLATFORM_TESTIMONIALS];

  return (
    <section
      className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950"
      aria-label="Client testimonials"
    >
      <div className={cn(section.container, section.padding)}>
        <div className="max-w-2xl">
          <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">
            Testimonials
          </p>
          <h2 className="mt-3 text-3xl leading-[1.15] font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-50">
            What our clients are saying
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-700 dark:text-slate-300">
            Real experiences from investors who value transparency, security, and long-term
            portfolio growth.
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
