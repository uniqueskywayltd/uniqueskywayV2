"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Briefcase, ClipboardList, HandCoins, Shield, ShieldCheck } from "lucide-react";

import { brandAssets } from "@/features/brand";
import { useI18n } from "@/features/i18n/i18n-provider";

/**
 * HP3 — Anniversary strip + About / Areas of Practice (legacy visual parity).
 * Presentation only; maps Read more to `/about`. No product engines.
 */
export function LegacyAboutPractice() {
  const { t } = useI18n();

  const practiceItems = [
    {
      titleKey: "legacy.about.practice.accounting.title",
      bodyKey: "legacy.about.practice.accounting.body",
      Icon: ClipboardList,
    },
    {
      titleKey: "legacy.about.practice.loan.title",
      bodyKey: "legacy.about.practice.loan.body",
      Icon: HandCoins,
    },
    {
      titleKey: "legacy.about.practice.reliability.title",
      bodyKey: "legacy.about.practice.reliability.body",
      Icon: Shield,
    },
    {
      titleKey: "legacy.about.practice.insurance.title",
      bodyKey: "legacy.about.practice.insurance.body",
      Icon: ShieldCheck,
    },
    {
      titleKey: "legacy.about.practice.withdrawal.title",
      bodyKey: "legacy.about.practice.withdrawal.body",
      Icon: Briefcase,
    },
  ] as const;

  return (
    <>
      <section
        className="bg-white px-4 py-[100px] font-[family-name:var(--font-legacy-arimo),Arimo,sans-serif] sm:px-[15px]"
        aria-label="Anniversary"
      >
        <div className="mx-auto grid max-w-[1170px] items-center gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="relative flex min-h-[180px] items-center lg:pl-[250px]">
              <div
                className="mb-6 flex max-w-[220px] flex-col items-center justify-center px-[15px] py-7 text-center lg:absolute lg:top-0 lg:left-0 lg:mb-0 lg:h-[180px] lg:w-[220px]"
                aria-hidden="true"
              >
                <p className="text-[72px] leading-none font-bold text-[#222] sm:text-[110px] sm:leading-[94px]">
                  9
                </p>
                <p className="text-[18px] leading-7 font-normal tracking-wide text-[#204669] uppercase sm:text-[22px]">
                  {t("legacy.about.years")}
                </p>
              </div>
              <h2 className="text-[28px] leading-9 font-bold text-[#222] sm:text-[36px] sm:leading-[42px]">
                {t("legacy.about.anniversary_title")}
              </h2>
            </div>
          </div>
          <div className="lg:col-span-5">
            <p className="mt-[18px] mb-[22px] text-justify text-[15px] leading-7 text-[#666]">
              {t("legacy.about.anniversary_body")}
            </p>
            <Link
              href="/about"
              className="group inline-flex items-center gap-2 text-base font-bold text-[#222]"
            >
              <ArrowRight
                className="size-3 transition group-hover:translate-x-0.5"
                aria-hidden="true"
              />
              <span className="border-b border-[#222] leading-4">
                {t("legacy.about.read_more")}
              </span>
            </Link>
          </div>
        </div>
      </section>

      <section
        className="bg-[#f0f5f9] px-4 py-[100px] font-[family-name:var(--font-legacy-arimo),Arimo,sans-serif] sm:px-[15px]"
        aria-label="Areas of practice"
      >
        <div className="mx-auto grid max-w-[1170px] items-start gap-12 lg:grid-cols-2">
          <div>
            <h3 className="mb-4 text-[22px] leading-8 font-bold tracking-wide text-[#222] uppercase">
              {t("legacy.about.banking_sector")}
            </h3>
            <div className="group relative mr-0 overflow-hidden lg:mr-[70px] [clip-path:polygon(0%_0%,100%_0%,100%_100%,0%_90%,0%_0%)]">
              <Image
                src={brandAssets.about.banking}
                alt=""
                width={1400}
                height={1004}
                className="h-auto w-full object-cover"
              />
              <div
                className="pointer-events-none absolute inset-y-0 left-[-75%] w-1/2 skew-x-[-25deg] bg-gradient-to-r from-transparent to-white/30 group-hover:animate-[legacyShine_1s_ease]"
                aria-hidden="true"
              />
            </div>
          </div>

          <div>
            <div className="mb-5">
              <p className="relative mb-2.5 inline-block pl-[55px] text-[18px] leading-[26px] font-normal tracking-wide text-[#666] uppercase before:absolute before:top-3 before:left-0 before:h-0.5 before:w-[45px] before:bg-[#da2c46] before:content-['']">
                {t("legacy.about.practice_eyebrow")}
              </p>
              <h3 className="text-[28px] leading-9 font-bold text-[#222] sm:text-[40px] sm:leading-[46px]">
                {t("legacy.about.practice_title")}
              </h3>
            </div>
            <p className="mb-8 text-[15px] leading-7 text-[#666]">
              {t("legacy.about.practice_lead")}
            </p>

            <ul>
              {practiceItems.map((item) => (
                <li key={item.titleKey} className="group relative mb-[31px] pl-[85px] last:mb-0">
                  <div className="absolute top-[5px] left-0 size-[60px]">
                    <span
                      className="absolute bottom-[-15px] left-[10px] h-[60px] w-10 origin-bottom-left -rotate-45 bg-[#f3dfe5] transition duration-500 group-hover:-rotate-90"
                      aria-hidden="true"
                    />
                    <item.Icon
                      className="relative z-[1] size-10 text-[#204669]"
                      aria-hidden="true"
                      strokeWidth={1.5}
                    />
                  </div>
                  <h4 className="mb-2.5 text-[18px] leading-7 font-bold text-[#222]">
                    {t(item.titleKey)}
                  </h4>
                  <p className="text-[14px] leading-6 text-[#666]">{t(item.bodyKey)}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
