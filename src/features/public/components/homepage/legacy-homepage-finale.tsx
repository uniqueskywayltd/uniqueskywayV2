"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";

import { brandAssets } from "@/features/brand";
import { submitContactIntake } from "@/features/public/actions/contact-intake";
import { cn } from "@/lib/utils";

const TESTIMONIALS = [
  {
    quote:
      "Very happy indeed with Harry Roberts' help. I had to surrender a couple issues earlier than intended and he was very helpful and efficient.",
    name: "Robert Sneijder",
    role: "Investor",
    thumb: "/legacy/hp6/thumbs/IMG_2765.jpg",
  },
  {
    quote:
      "Investing in any new venture is always daunting,however, Charles and his team made this a wonderful experience. Throughout the process, Charles was at hand to advise but never imposing or pushing.",
    name: "Christine Eva",
    role: "Investor",
    thumb: "/legacy/hp6/thumbs/IMG_2764.jpg",
  },
  {
    quote:
      "Was looking for an investment to park some funds. Charles's professional approach got the win. He does give necessary facts and figures as and when you do have a question.",
    name: "Mohammad Ali",
    role: "Shareholder",
    thumb: "/legacy/hp6/thumbs/IMG_2771.jpg",
  },
  {
    quote:
      "I purchased an investment package and held it for a year. The whole experience was absolutely first class — Alex advised me every step of the way.",
    name: "Ludmila alekseeva",
    role: "Member",
    thumb: "/legacy/hp6/thumbs/IMG_2769.jpg",
  },
  {
    quote:
      "Really helpful, I was set up with a long strategy but they managed to get me a good outcome on short notice. Many thanks.",
    name: "Tomas Tom",
    role: "Marketer",
    thumb: "/legacy/hp6/thumbs/IMG_2766.jpg",
  },
  {
    quote:
      "Charles Keller approach gave me confidence... professional and informative who was able to give clear advice and guidance.",
    name: "Roman Alekseeva",
    role: "Investor",
    thumb: "/legacy/hp6/thumbs/IMG_2773.jpg",
  },
  {
    quote:
      "Dealt with Irina Ashurov — great company to deal with — easy and professional.",
    name: "Vikentijs Tarasenko",
    role: "Shareholder",
    thumb: "/legacy/hp6/thumbs/IMG_2720.jpg",
  },
  {
    quote:
      "My portfolio Director Charles has been incredibly helpful and insightful throughout the entire process. A seamless experience.",
    name: "Irina Mashchenko",
    role: "Investor",
    thumb: "/legacy/hp6/thumbs/IMG_2719.jpg",
  },
] as const;

const CLIENT_LOGOS = [
  "IMG_2815.jpg",
  "IMG_2816.png",
  "IMG_2800.png",
  "IMG_2801.png",
  "IMG_2802.png",
  "IMG_2803.png",
  "IMG_2804.png",
  "IMG_2805.jpg",
  "IMG_2806.png",
  "IMG_2807.png",
  "IMG_2808.jpg",
  "IMG_2809.jpg",
  "IMG_2812.jpg",
  "IMG_2813.jpg",
  "IMG_2814.jpg",
  "IMG_2828.jpg",
  "IMG_2827.png",
  "IMG_2826.png",
  "IMG_2825.png",
] as const;

/**
 * Fun-fact labels from legacy layout only.
 * Numeric AUM claims are NOT copied — figures await certified reporting.
 */
const FUN_FACTS = [
  { label: "Total funds management" },
  { label: "Natural Energy" },
  { label: "NFTs" },
  { label: "Real Estate" },
  { label: "Real Asset Fund" },
] as const;

function subscribeReducedMotion(onStoreChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

function SupportSection() {
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [hint, setHint] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const phone = String(data.get("phone") ?? "").trim();
    const body = String(data.get("message") ?? "").trim();
    setPending(true);
    setHint(null);

    const result = await submitContactIntake({
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      topic: "Homepage support",
      message: phone ? `${body}\n\nPhone: ${phone}` : body,
      companyWebsite: "",
    });

    setPending(false);
    if (result.ok) {
      setStatus("success");
      form.reset();
      return;
    }
    setStatus("error");
    setHint(
      result.error === "rate_limited"
        ? "Please wait a moment before sending another message."
        : "We could not accept that message. Please try again or use Contact.",
    );
  }

  return (
    <section
      className="relative z-[2] -mb-16 px-4 font-[family-name:var(--font-legacy-arimo),Arimo,sans-serif] sm:px-[15px] lg:-mb-24"
      aria-label="Support"
    >
      <div className="mx-auto max-w-[1170px] overflow-hidden bg-[#204669]">
        <div className="grid lg:grid-cols-12">
          <div className="px-6 py-14 text-white sm:px-12 lg:col-span-7 lg:px-20 lg:py-20">
            <h2 className="mb-3.5 text-[28px] leading-9 font-bold sm:text-[36px] sm:leading-[42px]">
              Serving investors is what we do
            </h2>
            <p className="mb-10 text-justify text-[15px] leading-7 text-white/90">
              Please get in touch - our expert team will help you. Choose the appropriate business
              unit below, and your request will be directed to the right person.
            </p>

            {status === "success" ? (
              <p className="rounded bg-white/10 px-4 py-6 text-sm leading-6" role="status">
                Thanks — our team will connect with you soon through email.
              </p>
            ) : (
              <form onSubmit={onSubmit} className="space-y-6">
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Your Name"
                  maxLength={120}
                  className="h-[55px] w-full border-2 border-white bg-white px-5 text-base text-[#222] outline-none focus:border-[#da2c46]"
                />
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="Email address"
                  maxLength={254}
                  className="h-[55px] w-full border-2 border-white bg-white px-5 text-base text-[#222] outline-none focus:border-[#da2c46]"
                />
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone"
                  className="h-[55px] w-full border-2 border-white bg-white px-5 text-base text-[#222] outline-none focus:border-[#da2c46]"
                />
                <textarea
                  name="message"
                  required
                  placeholder="Message"
                  minLength={10}
                  maxLength={4000}
                  className="h-[168px] w-full resize-none border-2 border-white bg-white px-5 py-3 text-base text-[#222] outline-none focus:border-[#da2c46]"
                />
                {hint ? <p className="text-sm text-[#ffd5dc]">{hint}</p> : null}
                <button
                  type="submit"
                  disabled={pending}
                  className="w-full bg-[#da2c46] px-[30px] py-[12.5px] text-base font-bold tracking-wide text-white uppercase transition hover:opacity-90 disabled:opacity-60"
                >
                  {pending ? "Submitting…" : "Submit"}
                </button>
              </form>
            )}
          </div>

          <div className="relative lg:col-span-5 lg:-ml-10">
            <div className="group relative overflow-hidden">
              <Image
                src={brandAssets.support}
                alt=""
                width={960}
                height={641}
                className="h-full min-h-[320px] w-full object-cover"
              />
              <div
                className="pointer-events-none absolute inset-y-0 left-[-75%] w-1/2 skew-x-[-25deg] bg-gradient-to-r from-transparent to-white/30 group-hover:animate-[legacyShine_1s_ease]"
                aria-hidden="true"
              />
            </div>
            <div className="absolute bottom-6 left-6 flex size-20 items-center justify-center rounded bg-[#10ab7a] p-3 shadow-lg sm:bottom-10 sm:left-10">
              <Image
                src={brandAssets.icon}
                alt=""
                width={64}
                height={64}
                className="size-12 rounded object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  const [index, setIndex] = useState(0);
  const reduced = usePrefersReducedMotion();
  const item = TESTIMONIALS[index] ?? TESTIMONIALS[0];

  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % TESTIMONIALS.length);
    }, 5500);
    return () => window.clearInterval(id);
  }, [reduced]);

  return (
    <section
      className="relative bg-cover bg-center px-4 pt-28 pb-16 font-[family-name:var(--font-legacy-arimo),Arimo,sans-serif] sm:px-[15px] sm:pt-36 sm:pb-20"
      style={{ backgroundImage: `url(${brandAssets.testimonialsBackground})` }}
      aria-label="Testimonials"
    >
      <div className="absolute inset-0 bg-[#0a1c2d]/75" aria-hidden="true" />
      <div className="relative z-[1] mx-auto max-w-[1170px]">
        <div className="mb-12 grid gap-8 lg:grid-cols-2 lg:items-end">
          <div>
            <p className="relative mb-2.5 inline-block pr-[55px] text-[18px] leading-[26px] font-normal tracking-wide text-white/80 uppercase before:absolute before:top-3 before:right-0 before:h-0.5 before:w-[45px] before:bg-[#da2c46] before:content-['']">
              testimonials
            </p>
            <h2 className="text-[28px] leading-9 font-bold text-white sm:text-[40px] sm:leading-[46px]">
              What Our Loving <br />
              Clients are Saying
            </h2>
          </div>
          <p className="text-justify text-[15px] leading-7 text-white/85">
            We had a brilliant experience with the company and Robert. He answered many questions
            from my husband and i over email and the telegram. Not at any point did we feel under
            prssure to make a decision. Our knowledge and confidence has ngrown, which is all down
            to Robert.
          </p>
        </div>

        <div className="rounded bg-white/95 px-6 py-10 text-center text-[#222] shadow-lg sm:px-12">
          <p className="mx-auto max-w-3xl text-[16px] leading-8">{item?.quote}</p>
          <p className="mt-6 text-base font-bold">{item?.name}</p>
          <p className="text-sm text-[#666]">{item?.role}</p>
        </div>

        <div className="mt-10 flex flex-wrap items-end justify-center gap-4 sm:gap-6">
          {TESTIMONIALS.map((entry, thumbIndex) => {
            const active = thumbIndex === index;
            return (
              <button
                key={entry.name}
                type="button"
                onClick={() => setIndex(thumbIndex)}
                className={cn(
                  "flex flex-col items-center transition",
                  active ? "opacity-100" : "opacity-50 hover:opacity-80",
                )}
                aria-pressed={active}
                aria-label={`${entry.name} testimonial`}
              >
                <Image
                  src={entry.thumb}
                  alt=""
                  width={72}
                  height={72}
                  className={cn(
                    "rounded-full object-cover",
                    active ? "size-[72px] ring-2 ring-[#da2c46]" : "size-14",
                  )}
                />
                {active ? (
                  <span className="mt-2 text-center text-xs text-white">
                    <span className="block font-bold">{entry.name}</span>
                    <span className="text-white/70">{entry.role}</span>
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ClientsSection() {
  const reduced = usePrefersReducedMotion();
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => {
      setOffset((current) => (current + 1) % CLIENT_LOGOS.length);
    }, 2800);
    return () => window.clearInterval(id);
  }, [reduced]);

  const visible = [
    ...CLIENT_LOGOS.slice(offset),
    ...CLIENT_LOGOS.slice(0, offset),
  ].slice(0, 6);

  return (
    <section
      className="bg-white px-4 py-12 font-[family-name:var(--font-legacy-arimo),Arimo,sans-serif] sm:px-[15px]"
      aria-label="Clients"
    >
      <div className="mx-auto flex max-w-[1170px] flex-wrap items-center justify-center gap-8 sm:gap-10">
        {visible.map((file) => (
          <Image
            key={`${file}-${offset}`}
            src={`/legacy/hp6/clients/${file}`}
            alt=""
            width={140}
            height={60}
            className="h-12 w-auto max-w-[140px] object-contain opacity-80 grayscale transition hover:opacity-100 hover:grayscale-0"
          />
        ))}
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section
      className="relative overflow-hidden px-4 py-[62px] font-[family-name:var(--font-legacy-arimo),Arimo,sans-serif] sm:px-[15px]"
      style={{ background: "#204669" }}
      aria-label="Call to action"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-30"
        style={{ backgroundImage: "url(/legacy/hp6/shape-3.png)" }}
        aria-hidden="true"
      />
      <div className="relative z-[1] mx-auto flex max-w-[1170px] flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <h2 className="max-w-2xl text-[24px] leading-8 font-bold text-white sm:text-[30px] sm:leading-10">
          We help you to unlock & unleash the power within.
        </h2>
        <Link
          href="/about"
          className="inline-block border-2 border-white px-10 py-2.5 text-base font-bold text-white uppercase transition hover:bg-white hover:text-[#204669]"
        >
          Know more
        </Link>
      </div>
    </section>
  );
}

function FunFactsSection() {
  return (
    <section
      className="border-b border-white/10 bg-[#0a1c2d] px-4 py-8 font-[family-name:var(--font-legacy-arimo),Arimo,sans-serif] sm:px-[15px]"
      aria-label="Fun facts"
    >
      <div className="mx-auto grid max-w-[1170px] gap-8 sm:grid-cols-2 lg:grid-cols-5">
        {FUN_FACTS.map((fact) => (
          <div key={fact.label} className="text-center">
            <p className="text-[28px] leading-9 font-bold text-white sm:text-[36px] sm:leading-[44px]">
              —
            </p>
            <p className="mt-1 text-sm text-[#888]">{fact.label}</p>
          </div>
        ))}
      </div>
      <p className="mx-auto mt-6 max-w-[1170px] text-center text-[12px] leading-5 text-white/50">
        Figures appear from certified reporting when published. Legacy headline AUM numbers are not
        displayed.
      </p>
    </section>
  );
}

export function LegacyPreloader() {
  const reduced = usePrefersReducedMotion();
  const [visible, setVisible] = useState(!reduced);
  const hideTimer = useRef<number | null>(null);

  useEffect(() => {
    if (reduced) return;
    hideTimer.current = window.setTimeout(() => setVisible(false), 900);
    return () => {
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
  }, [reduced]);

  if (reduced || !visible) return null;

  return (
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center bg-[#0a1c2d]"
      aria-hidden="true"
    >
      <Image
        src={brandAssets.icon}
        alt=""
        width={72}
        height={72}
        className="size-[72px] animate-pulse rounded-xl object-cover"
        priority
      />
    </div>
  );
}

/**
 * HP6 — Support, testimonials, clients, CTA, fun facts (legacy visual finale).
 * Fun-fact numerics intentionally withheld pending certified metrics.
 */
export function LegacyHomepageFinale() {
  return (
    <>
      <SupportSection />
      <TestimonialsSection />
      <ClientsSection />
      <CtaSection />
      <FunFactsSection />
    </>
  );
}
