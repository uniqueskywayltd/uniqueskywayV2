"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { LEGACY_ACCENT } from "@/features/public/legacy/tokens";
import { cn } from "@/lib/utils";

const PROJECTS = [
  {
    image: "/legacy/projects/IMG_2756.jpg",
    sector: "NFTs Tokenization",
    title: "Collectible Digital World",
  },
  {
    image: "/legacy/projects/IMG_2703.jpg",
    sector: "Real Estate",
    title: "Building to your Satisfaction",
  },
  {
    image: "/legacy/projects/IMG_2711.jpg",
    sector: "Real World Asset",
    title: "Commodities on demand is our Priority Profitability Business",
  },
  {
    image: "/legacy/projects/IMG_2717.jpg",
    sector: "Corporate Management",
    title: "We are here to serve you better",
  },
  {
    image: "/legacy/projects/IMG_2716.jpg",
    sector: "Financial Initiatives",
    title: "Planning & Task Completion",
  },
  {
    image: "/legacy/projects/IMG_2712.jpg",
    sector: "Natural Energy",
    title: "Planning & Task Completion",
  },
  {
    image: "/legacy/projects/IMG_2739.jpg",
    sector: "Financial Loan",
    title: "Growing your Financial Firm",
  },
  {
    image: "/legacy/projects/IMG_2750.jpg",
    sector: "Crypto Mining & Trading",
    title: "Digital Asset",
  },
  {
    image: "/legacy/projects/IMG_2747.jpg",
    sector: "Tokenize Mechanized Agriculture",
    title: "Huge Mechanized Project Completion",
  },
  {
    image: "/legacy/projects/IMG_2740.jpg",
    sector: "Financial Grant",
    title: "Private Enterprize Building",
  },
] as const;

const PIE_STATS = [
  {
    value: 0.85,
    color: "#204619",
    label: (
      <>
        Global Flexibility <br />
        Investment
      </>
    ),
    caption: "Upto 85% Asests",
  },
  {
    value: 0.75,
    color: "#28a745",
    label: (
      <>
        Security Financial <br />
        Solutions
      </>
    ),
    caption: "Upto 75% Efficient",
  },
] as const;

const AUTO_MS = 4000;
const TRANSITION_MS = 1000;
const PIE_DURATION_MS = 3000;
const PIE_SIZE = 170;
const PIE_THICKNESS = 20;

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
    () => {
      const width = window.innerWidth;
      if (width >= 1024) return 3;
      if (width >= 600) return 2;
      return 1;
    },
    () => 1,
  );
}

function ProjectCarouselInner({ itemsPerView }: { itemsPerView: number }) {
  const [index, setIndex] = useState(0);
  const [animate, setAnimate] = useState(true);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => {
      setIndex((current) => current + 1);
    }, AUTO_MS);
    return () => window.clearInterval(id);
  }, [reduced]);

  useEffect(() => {
    if (index < PROJECTS.length) return;
    const id = window.setTimeout(() => {
      setAnimate(false);
      setIndex(0);
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setAnimate(true));
      });
    }, TRANSITION_MS);
    return () => window.clearTimeout(id);
  }, [index]);

  const slides = [...PROJECTS, ...PROJECTS.slice(0, itemsPerView)];
  const itemWidthPct = 100 / itemsPerView;

  return (
    <section
      className="relative font-[family-name:var(--font-legacy-arimo),Arimo,sans-serif]"
      aria-label="Projects and sectors"
    >
      <div className="overflow-hidden">
        <div
          className={cn("flex", animate && "transition-transform duration-1000 ease-in-out")}
          style={{ transform: `translateX(-${index * itemWidthPct}%)` }}
        >
          {slides.map((project, slideIndex) => (
            <article
              key={`${project.image}-${slideIndex}`}
              className="group relative shrink-0"
              style={{ width: `${itemWidthPct}%` }}
            >
              <div className="relative block overflow-hidden">
                <div
                  className="absolute inset-0 z-[1] shadow-[inset_0_-200px_100px_-40px_rgba(0,0,0,0.8)] transition duration-500"
                  aria-hidden="true"
                />
                <Image
                  src={project.image}
                  alt=""
                  width={612}
                  height={408}
                  className="h-auto w-full object-cover transition-transform duration-[5000ms] ease-in-out group-hover:scale-150"
                  sizes="(min-width: 1024px) 33vw, (min-width: 600px) 50vw, 100vw"
                />
                <div className="absolute right-0 bottom-0 left-0 z-[1] px-[30px] pt-[30px] pb-[57px] sm:px-[75px]">
                  <p className="relative mb-[5px] inline-block pr-[58px] text-[15px] leading-7 text-white">
                    {project.sector}
                    <span
                      className="absolute top-3 right-0 h-0.5 w-[45px]"
                      style={{ background: LEGACY_ACCENT }}
                      aria-hidden="true"
                    />
                  </p>
                  <h2 className="m-0 text-[24px] leading-[30px] font-normal text-white sm:text-[30px] sm:leading-10">
                    {project.title}
                  </h2>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProjectCarousel() {
  const itemsPerView = useItemsPerView();
  return <ProjectCarouselInner key={itemsPerView} itemsPerView={itemsPerView} />;
}

function PieChart({
  value,
  color,
  active,
}: {
  value: number;
  color: string;
  active: boolean;
}) {
  const radius = (PIE_SIZE - PIE_THICKNESS) / 2;
  const circumference = 2 * Math.PI * radius;
  const reduced = usePrefersReducedMotion();
  const progress = active || reduced ? value : 0;
  const [display, setDisplay] = useState(1);
  const shown = reduced ? Math.round(value * 100) : display;

  useEffect(() => {
    if (!active || reduced) return;
    const target = Math.round(value * 100);
    const started = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - started) / PIE_DURATION_MS);
      setDisplay(Math.max(1, Math.round(1 + (target - 1) * t)));
      if (t < 1) frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [active, value, reduced]);

  return (
    <div className="relative mx-auto mb-4 size-[170px] sm:mb-[23px]">
      <svg width={PIE_SIZE} height={PIE_SIZE} viewBox={`0 0 ${PIE_SIZE} ${PIE_SIZE}`} aria-hidden="true">
        <circle
          cx={PIE_SIZE / 2}
          cy={PIE_SIZE / 2}
          r={radius}
          fill="none"
          stroke="#e7f0f8"
          strokeWidth={PIE_THICKNESS}
        />
        <circle
          cx={PIE_SIZE / 2}
          cy={PIE_SIZE / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={PIE_THICKNESS}
          strokeLinecap="butt"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          transform={`rotate(-90 ${PIE_SIZE / 2} ${PIE_SIZE / 2})`}
          style={{
            transition: reduced ? undefined : `stroke-dashoffset ${PIE_DURATION_MS}ms ease`,
          }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[36px] leading-[38px] font-normal text-[#222]">
        {shown}
        <span aria-hidden="true">%</span>
      </span>
    </div>
  );
}

function AnnualStats() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();
  const [inView, setInView] = useState(false);
  const active = reduced || inView;

  useEffect(() => {
    if (reduced) return;
    const node = sectionRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [reduced]);

  return (
    <section
      ref={sectionRef}
      className="relative px-4 py-[70px] font-[family-name:var(--font-legacy-arimo),Arimo,sans-serif] sm:px-[15px] sm:py-[95px]"
      aria-label="Annual statistics"
    >
      <div className="mx-auto grid max-w-[1170px] items-start gap-12 lg:grid-cols-2 lg:gap-0">
        <div>
          <div className="mb-[27px] text-center">
            <p className="relative mb-2.5 inline-block px-[55px] text-[18px] leading-[26px] font-normal tracking-wide text-[#666] uppercase before:absolute before:top-3 before:left-0 before:h-0.5 before:w-[45px] before:bg-[#da2c46] before:content-[''] after:absolute after:top-3 after:right-0 after:h-0.5 after:w-[45px] after:bg-[#da2c46] after:content-['']">
              Crew commitment to clients
            </p>
            <h2 className="text-[20px] leading-[30px] font-bold text-[#222]">
              This company&apos;s crew are guided by a clear Purpose: To take a stand for all
              investors, to treat them fairly, and to give them the best chance for investment
              success.
            </h2>
          </div>
          <p className="mb-[54px] text-justify text-[15px] leading-7 text-[#666]">
            In their interactions with our crew, our clients sense the values that set our company
            apart. Foremost among our values - and the essence of our unique corporate structure -
            is that our clients come first. We strive to provide exceptional service and expertly
            designed investment products with superior long-term performance. Why? We recognize that
            our clients are human beings with real needs and aspirations.
          </p>
          <div className="flex flex-col clear-both sm:flex-row">
            {PIE_STATS.map((stat) => (
              <div
                key={stat.caption}
                className="mb-4 w-full text-center sm:mb-0 sm:max-w-[50%] sm:flex-1"
              >
                <PieChart value={stat.value} color={stat.color} active={active} />
                <h3 className="mb-[9px] text-[18px] leading-[21px] font-bold text-[#222]">
                  {stat.label}
                </h3>
                <p className="m-0 text-[24px] font-normal text-[#222]">{stat.caption}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative lg:mt-[7px] lg:ml-[55px]">
          <div
            className="pointer-events-none absolute top-[120px] right-[-250px] hidden h-[271px] w-[347px] bg-contain bg-no-repeat lg:block"
            style={{ backgroundImage: "url(/legacy/shape/shape-1.png)" }}
            aria-hidden="true"
          />
          <div className="group relative overflow-hidden [clip-path:polygon(0%_0%,100%_0%,100%_90%,0%_100%,0%_0%)]">
            <Image
              src="/legacy/projects/IMG_2753.jpg"
              alt=""
              width={612}
              height={708}
              className="h-auto w-full object-cover"
            />
            <div
              className="pointer-events-none absolute inset-y-0 left-[-75%] w-1/2 skew-x-[-25deg] bg-gradient-to-r from-transparent to-white/30 group-hover:animate-[legacyShine_1s_ease]"
              aria-hidden="true"
            />
          </div>
          <div className="absolute bottom-0 left-1/2 z-[2] -translate-x-1/2">
            <div
              className="inline-block size-[170px] rounded-full px-[30px] py-[30px] text-center shadow-[0_0_0_10px_#fff]"
              style={{
                background: "linear-gradient(180deg, #da2c46 0%, #224669 100%)",
              }}
            >
              <Image
                src="/legacy/icons/icon-1.png"
                alt=""
                width={60}
                height={66}
                className="mx-auto mb-2.5 h-auto w-[36px]"
              />
              <span className="block text-[11px] leading-4 text-white">
                Financial & Consulting Award 2020-2021
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * HP4 — Project/sector carousel + annual statistics / pie charts / award (legacy visual parity).
 * Presentation only; no product or finance engines.
 */
export function LegacyProjectsStats() {
  return (
    <>
      <ProjectCarousel />
      <AnnualStats />
    </>
  );
}
