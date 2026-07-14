import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Award, Globe2, Shield, Users } from "lucide-react";

import { CurrencyTicker } from "@/features/public/components/currency-ticker";
import { HomepageHero } from "@/features/public/components/homepage/homepage-hero";
import { HomepageTestimonials } from "@/features/public/components/homepage/homepage-testimonials";
import {
  card,
  marketingOutlineBtn,
  marketingPrimaryBtn,
  section,
} from "@/features/public/components/marketing-ui";
import { cn } from "@/lib/utils";

const homepageStats = [
  { label: "Assets under management", value: "$250M+", suffix: "" },
  { label: "Active investors worldwide", value: "8,930+", suffix: "" },
  { label: "Years serving clients", value: "9+", suffix: "since 2017" },
  { label: "Investor portal access", value: "24/7", suffix: "" },
] as const;

const practiceAreas = [
  {
    image: "/brand/banking.webp",
    alt: "Banking and financial services",
    title: "Banking & Finance",
    description:
      "Clear financial reporting and structured investment products for informed decision-making.",
    tag: "Core",
    href: "/about",
  },
  {
    image: "/brand/real-estate.webp",
    alt: "Real estate investments",
    title: "Real Estate",
    description:
      "Diversified exposure to property and development projects with long-term growth potential.",
    tag: "Assets",
    href: "/about",
  },
  {
    image: "/brand/global-markets.webp",
    alt: "Global market access",
    title: "Global Markets",
    description:
      "Access to commodities and international opportunities through our global network.",
    tag: "Global",
    href: "/about",
  },
  {
    image: "/brand/advisory.webp",
    alt: "Financial advisory",
    title: "Advisory Services",
    description:
      "Personalized guidance to align your portfolio with your financial goals and risk tolerance.",
    tag: "Advisory",
    href: "/about",
  },
] as const;

const trustPillars = [
  {
    icon: Shield,
    title: "Security & compliance",
    text: "Enterprise-grade infrastructure with audit logging, encrypted storage, and role-based access control.",
  },
  {
    icon: Globe2,
    title: "Global perspective",
    text: "Diversified investment opportunities designed for investors who think beyond borders.",
  },
  {
    icon: Users,
    title: "Client-first service",
    text: "Dedicated support and transparent communication at every stage of your investment journey.",
  },
  {
    icon: Award,
    title: "Proven track record",
    text: "A history of helping clients build wealth through disciplined, transparent portfolio management.",
  },
] as const;

const journeySteps = [
  {
    step: 1,
    title: "Create your account",
    description: "Register in minutes with secure authentication and profile setup.",
    image: "/brand/contact.webp",
  },
  {
    step: 2,
    title: "Choose your plan",
    description: "Select an investment tier that matches your goals and deposit amount.",
    image: "/brand/corporate.webp",
  },
  {
    step: 3,
    title: "Fund & invest",
    description: "Deposit funds and activate your portfolio through our secure dashboard.",
    image: "/brand/banking.webp",
  },
  {
    step: 4,
    title: "Track & grow",
    description: "Monitor returns, request withdrawals, and refer others to earn bonuses.",
    image: "/brand/real-estate.webp",
  },
] as const;

export function HomepageView() {
  return (
    <>
      <CurrencyTicker />
      <HomepageHero />

      <section
        className="border-y border-border/50 bg-primary text-primary-foreground"
        aria-label="Platform highlights"
      >
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:gap-x-8 md:grid-cols-4 md:gap-y-0">
            {homepageStats.map((stat, index) => (
              <div
                key={stat.label}
                className={cn(
                  "text-center md:text-left",
                  index < homepageStats.length - 1
                    ? "md:border-r md:border-primary-foreground/15 md:pr-6 lg:pr-8"
                    : "",
                )}
              >
                <p className="text-xl font-semibold tracking-tight tabular-nums sm:text-2xl lg:text-3xl">
                  {stat.value}
                </p>
                {stat.suffix ? (
                  <p className="mt-0.5 text-[10px] font-medium tracking-wider text-primary-foreground/55 uppercase sm:text-xs">
                    {stat.suffix}
                  </p>
                ) : null}
                <p className="mt-1.5 text-[11px] leading-snug text-primary-foreground/70 sm:text-sm">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={section.padding} aria-label="What we do">
        <div className={section.container}>
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <p className={section.eyebrow}>What we do</p>
              <h2 className={section.heading}>Diversified investment services</h2>
              <p className={section.body}>
                We get to know you, build a custom plan, and put your capital to work across multiple
                asset classes — with transparency at every step.
              </p>
            </div>
            <Link href="/about" className={marketingOutlineBtn("shrink-0")}>
              View all services
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </Link>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:mt-14 lg:grid-cols-4">
            {practiceAreas.map((item) => (
              <Link key={item.title} href={item.href} className={cn(card.base, "flex flex-col")}>
                <div className="relative aspect-[4/3]">
                  <Image
                    src={item.image}
                    alt={item.alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 50vw, 25vw"
                  />
                  <span className="absolute top-3 left-3 rounded-md bg-background/90 px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
                    {item.tag}
                  </span>
                </div>
                <div className={card.padding}>
                  <h3 className="text-sm font-semibold sm:text-base">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className={section.padding} aria-label="Why Unique Sky Way">
        <div className={section.container}>
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border/60 shadow-md">
              <Image
                src="/brand/trust.webp"
                alt="Professional financial team"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent" />
              <div className="absolute right-5 bottom-5 left-5 rounded-lg border border-white/15 bg-slate-950/50 px-4 py-3 backdrop-blur-sm">
                <p className="text-sm leading-snug font-medium text-white">
                  &ldquo;Transparency isn&apos;t a feature — it&apos;s our foundation.&rdquo;
                </p>
              </div>
            </div>
            <div>
              <p className={section.eyebrow}>Why Unique Sky Way</p>
              <h2 className={section.heading}>Built for investors who demand more</h2>
              <p className={section.body}>
                We combine institutional discipline with a modern digital experience — giving you
                full visibility into your portfolio, transactions, and returns.
              </p>
              <div className="mt-10 grid gap-6 sm:grid-cols-2">
                {trustPillars.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="flex gap-3.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/50 text-primary">
                        <Icon className="h-4 w-4" aria-hidden />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold">{item.title}</h3>
                        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={cn("bg-muted/30", section.padding)} aria-label="How it works">
        <div className={section.container}>
          <div className="text-center">
            <p className={section.eyebrow}>Simple process</p>
            <h2 className={section.heading}>How it works</h2>
            <p className={section.bodyCenter}>
              From account creation to portfolio growth — a straightforward path designed for
              clarity and confidence.
            </p>
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:mt-14 lg:grid-cols-4 lg:gap-6">
            {journeySteps.map((step) => (
              <div key={step.step} className="group flex flex-col">
                <div className={cn(card.base, "relative mb-4 aspect-[4/3]")}>
                  <Image
                    src={step.image}
                    alt={step.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                  <div className="absolute top-4 left-4 flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground shadow-sm">
                    {step.step}
                  </div>
                </div>
                <h3 className="text-sm font-semibold sm:text-base">{step.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center lg:mt-14">
            <Link href="/how-it-works" className={marketingPrimaryBtn()}>
              See full process
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-muted/20 py-16" aria-label="Investment plans">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Investment plans
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-foreground">Plans coming soon</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Active investment plans configured in the admin portal will appear here automatically.
          </p>
        </div>
      </section>

      <HomepageTestimonials />

      <section className={cn("relative overflow-hidden", section.padding)} aria-label="Get started">
        <div className="absolute inset-0 -z-10 bg-primary" />
        <div className={section.container}>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-semibold leading-[1.15] tracking-tight text-primary-foreground sm:text-4xl">
              Your portfolio deserves a platform you can trust
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-primary-foreground/75">
              Join Unique Sky Way and access a secure investor dashboard with full transaction
              history, referral tracking, and professional support.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/auth/register"
                className={cn(
                  marketingPrimaryBtn("w-full sm:w-auto"),
                  "bg-white text-primary hover:bg-white/90 hover:text-primary",
                )}
              >
                Create free account
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
              </Link>
              <Link
                href="/about"
                className={cn(
                  marketingOutlineBtn("w-full sm:w-auto"),
                  "border-white/25 text-white hover:bg-white/10 hover:text-white",
                )}
              >
                Learn more about us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
