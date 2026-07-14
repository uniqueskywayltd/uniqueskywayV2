"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { brandAssets } from "@/features/brand";
import { LEGACY_NAVY } from "@/features/public/legacy/tokens";
import { cn } from "@/lib/utils";

const HERO_SLIDES = [
  {
    id: "join",
    image: brandAssets.hero.slides[0]!,
    title: "UniqueSkyWay",
    body: "We facilitate Trade occurrence and thus we are committed to enhancing the global financial economy and constructing patterns of intergenerational investors through our strategic investment portfolio. Our exceptional sustainability characteristics allow for account succession to offspring through boundaries.\nJOIN US AND EXPERIENCE THE DELIGHTS OF INVESTMENT.",
    cta: { label: "CREATE AN ACCOUNT", href: "/auth/register" },
  },
  {
    id: "integrity",
    image: brandAssets.hero.slides[1]!,
    title: "",
    body: "We are wholeheartedly Devoted to providing unparalleled Excellence and exceptional Services to Our Esteemed Investors. We firmly Assure absolute integrity, trustworthiness, and utmost transparency in all aspects of our operations, ensuring a solid foundation of credibility and accountability.",
    cta: { label: "REGISTER", href: "/auth/register" },
  },
  {
    id: "risk",
    image: brandAssets.hero.slides[2]!,
    title: "UniqueSkyWay",
    body: "We employ a Strategic approach to diversify our investment portfolio, effectively mitigating and managing various forms of risk inherent in financial investments. Explore the opportunities presented by our comprehensive selection of Long and Short Term Investment Packages.",
    cta: { label: "LOGIN", href: "/auth/login" },
  },
] as const;

const FLOATING_NOTES = [
  "Your dashboard updates after settlement.",
  "Need help? Visit the Help Centre.",
  "Complete verification to unlock all features.",
  "Statements are available from your account.",
] as const;

/**
 * Legacy banner carousel + floating notification chip (HP2).
 * No Owl / jQuery — native interval + CSS.
 */
export function LegacyHeroCarousel() {
  const [index, setIndex] = useState(0);
  const [noteIndex, setNoteIndex] = useState(0);
  const [noteVisible, setNoteVisible] = useState(true);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % HERO_SLIDES.length);
    }, 6500);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setNoteVisible(false);
      window.setTimeout(() => {
        setNoteIndex((current) => (current + 1) % FLOATING_NOTES.length);
        setNoteVisible(true);
      }, 350);
    }, 5000);
    return () => window.clearInterval(id);
  }, []);

  const slide = HERO_SLIDES[index] ?? HERO_SLIDES[0];

  return (
    <section
      id="hero"
      aria-label="Homepage banner"
      className="relative font-[family-name:var(--font-legacy-arimo),Arimo,sans-serif]"
    >
      <div className="relative overflow-hidden">
        {HERO_SLIDES.map((item, slideIndex) => {
          const active = slideIndex === index;
          return (
            <div
              key={item.id}
              className={cn(
                "relative overflow-hidden px-[15px] pt-[182px] pb-[123px] transition-opacity duration-700",
                active ? "block opacity-100" : "absolute inset-0 opacity-0 pointer-events-none",
              )}
              aria-hidden={!active}
            >
              <div className="absolute inset-0 z-0 overflow-hidden">
                <Image
                  src={item.image}
                  alt=""
                  fill
                  priority={slideIndex === 0}
                  className={cn(
                    "object-cover transition-transform duration-[6000ms] ease-linear",
                    active ? "scale-110" : "scale-100",
                  )}
                  sizes="100vw"
                />
                <div className="absolute inset-0 bg-black/50" aria-hidden="true" />
              </div>

              <div className="relative z-[5] mx-auto min-h-[300px] w-full max-w-[1170px] text-center text-white">
                {item.title ? (
                  <h1 className="mb-4 text-[22px] leading-8 font-bold sm:text-[28px] sm:leading-10">
                    {item.title}
                  </h1>
                ) : (
                  <h1 className="sr-only">UniqueSkyWay</h1>
                )}
                <p className="mx-auto max-w-4xl whitespace-pre-line text-[15px] leading-7 font-normal text-white sm:text-[17px] sm:leading-8">
                  {item.body}
                </p>
                <div className="mt-8">
                  <Link
                    href={item.cta.href}
                    className="inline-block px-[38px] py-[10px] text-base font-bold text-white transition hover:opacity-90"
                    style={{ background: LEGACY_NAVY }}
                  >
                    {item.cta.label}
                  </Link>
                </div>
              </div>
            </div>
          );
        })}

        <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2" aria-hidden="true">
          {HERO_SLIDES.map((item, slideIndex) => (
            <button
              key={item.id}
              type="button"
              className={cn(
                "size-2.5 rounded-full border border-white/70",
                slideIndex === index ? "bg-white" : "bg-transparent",
              )}
              aria-label={`Show slide ${slideIndex + 1}`}
              onClick={() => setIndex(slideIndex)}
            />
          ))}
        </div>
      </div>

      <div
        className={cn(
          "mgm notification fixed right-[50px] bottom-[50px] z-[999999] rounded-[7px] border border-black bg-[#e6e6e6] px-[15px] py-[10px] shadow-[0px_5px_13px_0px_rgba(0,0,0,0.3)] transition-opacity duration-300",
          noteVisible ? "opacity-100" : "opacity-0",
        )}
        aria-live="polite"
      >
        <p className="text-[12px] text-black">{FLOATING_NOTES[noteIndex]}</p>
      </div>

      <span className="sr-only">Current slide: {slide?.id}</span>
    </section>
  );
}
