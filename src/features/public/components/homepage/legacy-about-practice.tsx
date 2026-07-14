import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  ClipboardList,
  HandCoins,
  Shield,
  ShieldCheck,
} from "lucide-react";

import { brandAssets } from "@/features/brand";

const PRACTICE_ITEMS = [
  {
    title: "Company Accounting",
    body: "We provide clear and useful financial information on the basis of which you can make the right decisions",
    Icon: ClipboardList,
  },
  {
    title: "Loan Acquisition",
    body: "With a Portfolio Line of Credit, you can request to borrow in seconds at a very affordable rate and get money deposited in as little as 1 business day. If there's a simpler, faster way to borrow cash, we haven't seen it.",
    Icon: HandCoins,
  },
  {
    title: "High Reliability",
    body: "We are trusted by a huge number of people. We are working hard constantly to improve the level of our security system and minimize possible risks.",
    Icon: Shield,
  },
  {
    title: "Company Insurance",
    body: "Our Company is insured by world class leading insurance company, which is a prominent company when it comes to the field of investments.",
    Icon: ShieldCheck,
  },
  {
    title: "Quik Withdrawal",
    body: "Withdrawal requests are treated spontaneously once received. There are high maximum limits. The minimum withdrawal amount is only $100.",
    Icon: Briefcase,
  },
] as const;

/**
 * HP3 — Anniversary strip + About / Areas of Practice (legacy visual parity).
 * Presentation only; maps Read more to `/about`. No product engines.
 */
export function LegacyAboutPractice() {
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
                  Years
                </p>
              </div>
              <h2 className="text-[28px] leading-9 font-bold text-[#222] sm:text-[36px] sm:leading-[42px]">
                UniqueSkyWay Celebrates its 9TH YEAR SUCCESS IN BUSINESS.
              </h2>
            </div>
          </div>
          <div className="lg:col-span-5">
            <p className="mt-[18px] mb-[22px] text-justify text-[15px] leading-7 text-[#666]">
              Our esteemed company offers a unique opportunity for portfolio diversification through
              profitable business ventures and successful investment endeavors, ensuring long-term
              financial growth and stability.
            </p>
            <Link
              href="/about"
              className="group inline-flex items-center gap-2 text-base font-bold text-[#222]"
            >
              <ArrowRight className="size-3 transition group-hover:translate-x-0.5" aria-hidden="true" />
              <span className="border-b border-[#222] leading-4">Read more</span>
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
              BANKING SECTOR
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
                AREAS OF PRACTICE
              </p>
              <h3 className="text-[28px] leading-9 font-bold text-[#222] sm:text-[40px] sm:leading-[46px]">
                What We Can Do for You
              </h3>
            </div>
            <p className="mb-8 text-[15px] leading-7 text-[#666]">
              We get to know the real you. We put together a custom plan. We put your money to work.
            </p>

            <ul>
              {PRACTICE_ITEMS.map((item) => (
                <li
                  key={item.title}
                  className="group relative mb-[31px] pl-[85px] last:mb-0"
                >
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
                    {item.title}
                  </h4>
                  <p className="text-[14px] leading-6 text-[#666]">{item.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
