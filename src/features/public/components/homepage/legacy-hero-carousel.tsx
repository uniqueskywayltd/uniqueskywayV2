"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { brandAssets } from "@/features/brand";
import { useI18n } from "@/features/i18n/i18n-provider";
import { LEGACY_NAVY } from "@/features/public/legacy/tokens";
import { cn } from "@/lib/utils";

const HERO_SLIDE_IDS = ["join", "integrity", "risk"] as const;
const FLOATING_NOTE_KEYS = [
  "legacy.hero.note.dashboard",
  "legacy.hero.note.help",
  "legacy.hero.note.verify",
  "legacy.hero.note.statements",
] as const;

/**
 * Legacy banner carousel + floating notification chip (HP2).
 * No Owl / jQuery — native interval + CSS.
 */
export function LegacyHeroCarousel() {
  const { t } = useI18n();
  const [index, setIndex] = useState(0);
  const [noteIndex, setNoteIndex] = useState(0);
  const [noteVisible, setNoteVisible] = useState(true);

  const slides = [
    {
      id: "join" as const,
      image: brandAssets.hero.slides[0]!,
      title: t("legacy.hero.slide.join.title"),
      body: t("legacy.hero.slide.join.body"),
      cta: { label: t("legacy.hero.slide.join.cta"), href: "/auth/register" },
    },
    {
      id: "integrity" as const,
      image: brandAssets.hero.slides[1]!,
      title: "",
      body: t("legacy.hero.slide.integrity.body"),
      cta: { label: t("legacy.hero.slide.integrity.cta"), href: "/auth/register" },
    },
    {
      id: "risk" as const,
      image: brandAssets.hero.slides[2]!,
      title: t("legacy.hero.slide.risk.title"),
      body: t("legacy.hero.slide.risk.body"),
      cta: { label: t("legacy.hero.slide.risk.cta"), href: "/auth/login" },
    },
  ];

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, 6500);
    return () => window.clearInterval(id);
  }, [slides.length]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setNoteVisible(false);
      window.setTimeout(() => {
        setNoteIndex((current) => (current + 1) % FLOATING_NOTE_KEYS.length);
        setNoteVisible(true);
      }, 350);
    }, 5000);
    return () => window.clearInterval(id);
  }, []);

  const slide = slides[index] ?? slides[0];

  return (
    <section
      id="hero"
      aria-label={t("legacy.hero.banner_label")}
      className="relative font-[family-name:var(--font-legacy-arimo),Arimo,sans-serif]"
    >
      <div className="relative overflow-hidden">
        {slides.map((item, slideIndex) => {
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
                  <h1 className="sr-only">{t("legacy.hero.brand_sr")}</h1>
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

        <div
          className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2"
          aria-hidden="true"
        >
          {HERO_SLIDE_IDS.map((itemId, slideIndex) => (
            <button
              key={itemId}
              type="button"
              className={cn(
                "size-2.5 rounded-full border border-white/70",
                slideIndex === index ? "bg-white" : "bg-transparent",
              )}
              aria-label={t("legacy.hero.show_slide", { number: slideIndex + 1 })}
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
        <p className="text-[12px] text-black">
          {t(FLOATING_NOTE_KEYS[noteIndex] ?? FLOATING_NOTE_KEYS[0])}
        </p>
      </div>

      <span className="sr-only">Current slide: {slide?.id}</span>
    </section>
  );
}
