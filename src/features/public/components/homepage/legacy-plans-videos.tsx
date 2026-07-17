"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";

import { brandAssets } from "@/features/brand";
import { useI18n } from "@/features/i18n/i18n-provider";
import { CERTIFIED_PUBLIC_PLANS, formatPlanMoney } from "@/features/public/content/certified-plans";
import { cn } from "@/lib/utils";

const VIDEO_OPTIONS = [
  {
    id: "english" as const,
    labelKey: "legacy.plans.video.english",
    src: brandAssets.videos.english,
  },
  {
    id: "spanish" as const,
    labelKey: "legacy.plans.video.spanish",
    src: brandAssets.videos.spanish,
  },
  { id: "french" as const, labelKey: "legacy.plans.video.french", src: null },
];

const AUTO_MS = 4500;
const TRANSITION_MS = 1000;

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

function useItemsPerView() {
  return useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("resize", onStoreChange);
      return () => window.removeEventListener("resize", onStoreChange);
    },
    () => (window.innerWidth >= 768 ? 2 : 1),
    () => 1,
  );
}

function PlansCarouselInner({ itemsPerView }: { itemsPerView: number }) {
  const { t } = useI18n();
  const [index, setIndex] = useState(0);
  const [animate, setAnimate] = useState(true);
  const reduced = usePrefersReducedMotion();

  const planCards = useMemo(
    () => [
      ...CERTIFIED_PUBLIC_PLANS.map((plan) => ({
        name: plan.name,
        duration: t("legacy.plans.duration_days", { count: plan.durationDays }),
        eligibility: t("legacy.plans.min_deposit", { amount: formatPlanMoney(plan.minDeposit) }),
        earnings: t("legacy.plans.daily_return", { percent: plan.dailyRoiPercent }),
        status: t("legacy.plans.status_active"),
      })),
      {
        name: t("legacy.plans.featured_name"),
        duration: t("legacy.plans.duration_certified"),
        eligibility: t("legacy.plans.eligibility_certified"),
        earnings: t("legacy.plans.earnings_certified"),
        status: t("legacy.plans.status_awaiting"),
      },
    ],
    [t],
  );

  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => setIndex((current) => current + 1), AUTO_MS);
    return () => window.clearInterval(id);
  }, [reduced]);

  useEffect(() => {
    if (index < planCards.length) return;
    const id = window.setTimeout(() => {
      setAnimate(false);
      setIndex(0);
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setAnimate(true));
      });
    }, TRANSITION_MS);
    return () => window.clearTimeout(id);
  }, [index, planCards.length]);

  const slides = [...planCards, ...planCards.slice(0, itemsPerView)];
  const itemWidthPct = 100 / itemsPerView;

  return (
    <div className="overflow-hidden px-1 py-2" aria-label={t("legacy.plans.carousel_label")}>
      <div
        className={cn("flex", animate && "transition-transform duration-1000 ease-in-out")}
        style={{ transform: `translateX(-${index * itemWidthPct}%)` }}
      >
        {slides.map((plan, slideIndex) => (
          <article
            key={`${plan.name}-${slideIndex}`}
            className="shrink-0 px-2 sm:px-3"
            style={{ width: `${itemWidthPct}%` }}
          >
            <div className="rounded-[10px] bg-white text-center shadow-none transition duration-500 hover:shadow-[0_10px_20px_rgba(0,0,0,0.1)]">
              <div className="border-b border-[#8db6d6] px-0 pt-[33px] pb-[22px]">
                <div
                  className="relative mb-[26px] bg-cover bg-center px-0 py-7"
                  style={{ backgroundImage: `url(${brandAssets.plans.cardBackground})` }}
                >
                  <div className="bg-black/60 px-3 py-4 text-white">
                    <h3 className="mb-2 text-[20px] leading-7 font-bold text-white uppercase">
                      {plan.name}
                    </h3>
                    <p className="text-[15px] leading-6 font-normal text-white/95 sm:text-[17px]">
                      {plan.status}
                    </p>
                  </div>
                </div>
                <p className="px-4 text-[13px] leading-5 text-[#222]">
                  {t("legacy.plans.terms_note")}
                </p>
              </div>
              <div className="px-[15px] py-7">
                <ul className="space-y-3 text-[15px] leading-6 text-[#222] sm:text-base">
                  <li>
                    <b>{plan.duration}</b>
                  </li>
                  <li>
                    <b>{plan.eligibility}</b>
                  </li>
                  <li>
                    <b>{plan.earnings}</b>
                  </li>
                  <li>
                    <b>{t("legacy.plans.not_guaranteed")}</b>
                  </li>
                  <li>
                    <b>{t("legacy.plans.see_risk")}</b>
                  </li>
                </ul>
              </div>
              <div className="pb-[31px]">
                <Link
                  href="/auth/register?intent=plan"
                  className="relative z-[1] inline-block overflow-hidden rounded-[30px] border-2 border-[#1c6ead] px-[57px] py-[10px] text-base leading-[26px] font-bold text-[#222] uppercase transition hover:bg-[#1c6ead] hover:text-white"
                >
                  {t("legacy.plans.buy")}
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
      <p className="mt-4 px-3 text-center text-[12px] leading-5 text-[#666]">
        {t("legacy.plans.footer_note")}{" "}
        <Link href="/legal/risk" className="underline underline-offset-2">
          {t("legacy.plans.risk_disclosure")}
        </Link>
        .
      </p>
    </div>
  );
}

function PlansCarousel() {
  const itemsPerView = useItemsPerView();
  return <PlansCarouselInner key={itemsPerView} itemsPerView={itemsPerView} />;
}

function VideoPanel() {
  const { t } = useI18n();
  const [activeId, setActiveId] = useState<(typeof VIDEO_OPTIONS)[number]["id"]>("english");
  const videoRef = useRef<HTMLVideoElement>(null);
  const active = VIDEO_OPTIONS.find((option) => option.id === activeId) ?? VIDEO_OPTIONS[0];

  useEffect(() => {
    const node = videoRef.current;
    if (!node) return;
    node.pause();
    node.load();
  }, [activeId]);

  return (
    <div className="w-full">
      <div className="relative w-full overflow-hidden bg-black pt-[56.25%]">
        {active?.src ? (
          <video
            key={active.src}
            ref={videoRef}
            controls
            className="absolute inset-0 h-full w-full object-contain"
            preload="metadata"
          >
            <source src={active.src} type="video/mp4" />
          </video>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[#111] px-6 text-center">
            <p className="text-sm leading-6 text-white/90">{t("legacy.plans.video_unavailable")}</p>
          </div>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {VIDEO_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setActiveId(option.id)}
            className={cn(
              "rounded-sm px-3 py-1.5 text-xs font-semibold text-white transition",
              activeId === option.id ? "bg-[#c82333]" : "bg-[#dc3545] hover:bg-[#c82333]",
            )}
            aria-pressed={activeId === option.id}
          >
            {t(option.labelKey)}
          </button>
        ))}
      </div>
    </div>
  );
}

function CertificationModal() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 rounded-[5px] border-2 border-white bg-[#00004d] px-3 py-1.5 text-sm font-semibold text-white transition hover:opacity-90"
      >
        {t("legacy.plans.view_certificate")}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={() => setOpen(false)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-[90vw]"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id={titleId} className="sr-only">
              {t("legacy.plans.certification_sr")}
            </h2>
            <button
              ref={closeRef}
              type="button"
              onClick={() => setOpen(false)}
              className="absolute top-[-36px] right-0 text-[30px] leading-none text-white"
              aria-label={t("legacy.plans.close_certificate")}
            >
              ×
            </button>
            <Image
              src={brandAssets.plans.certificate}
              alt={t("legacy.plans.cert_alt")}
              width={1200}
              height={1600}
              className="mx-auto h-auto max-h-[90vh] w-auto max-w-full object-contain"
              priority
            />
          </div>
        </div>
      ) : null}
    </>
  );
}

/**
 * HP5 — Plans carousel + multilingual video + certification modal (legacy visual parity).
 * Plan terms come from certified placeholders — no legacy PHP financial values.
 */
export function LegacyPlansVideos() {
  const { t } = useI18n();

  return (
    <section
      className="relative bg-white px-4 py-10 font-[family-name:var(--font-legacy-arimo),Arimo,sans-serif] sm:px-[15px] sm:py-12"
      aria-label={t("legacy.plans.section_label")}
    >
      <div className="mx-auto grid max-w-[1170px] gap-8 lg:grid-cols-12 lg:items-start">
        <div className="lg:col-span-4">
          <VideoPanel />
          <CertificationModal />
        </div>
        <div className="lg:col-span-8">
          <PlansCarousel />
        </div>
      </div>
    </section>
  );
}
