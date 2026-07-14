"use client";

import { type FormEvent, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, User } from "lucide-react";

import { LEGACY_FOOTER_BG, LEGACY_MUTED, LEGACY_NAVY } from "@/features/public/legacy/tokens";
import { LEGACY_USEFUL_LINKS } from "@/features/public/legacy/nav";

export function PublicFooter() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  function onNewsletterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Visual parity only in HP1 — no list vendor; honest UI feedback.
    setMessage("Thanks — newsletter signup will be available through Contact.");
    setName("");
    setEmail("");
  }

  return (
    <footer className="font-[family-name:var(--font-legacy-arimo),Arimo,sans-serif]" style={{ background: LEGACY_FOOTER_BG }}>
      <div className="border-b border-white/10 px-4 py-[96px] sm:px-6">
        <div className="mx-auto grid max-w-[1170px] gap-10 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <Link href="/" className="inline-block">
              <Image
                src="/legacy/logo.png"
                alt="UniqueSkyWay"
                width={160}
                height={60}
                className="mb-[27px] h-auto w-[160px] bg-white/95 object-contain p-1"
              />
            </Link>
            <p className="mb-3 text-sm leading-6" style={{ color: LEGACY_MUTED }}>
              Our company brings you an opportunity to diversify your portfolio with successful
              business projects and investments.
            </p>
            <ul className="mb-4 space-y-1 text-sm" style={{ color: LEGACY_MUTED }}>
              <li className="relative pl-[26px]">
                <MapPin className="absolute top-[3px] left-0 size-4" aria-hidden="true" />
                Fayetteville ARKANSAS, United Stated of Ameriaca
              </li>
              <li className="relative pl-[26px]">
                <Mail className="absolute top-[3px] left-0 size-4" aria-hidden="true" />
                Email{" "}
                <a className="hover:underline" href="mailto:support@uniqueskyway.ltd">
                  support@uniqueskyway.ltd
                </a>
              </li>
            </ul>
          </div>

          <div className="lg:pl-10">
            <h4 className="relative mb-6 pb-3 text-lg font-bold text-white after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-10 after:bg-[#da2c46] after:content-['']">
              Useful Links
            </h4>
            <ul className="space-y-3">
              {LEGACY_USEFUL_LINKS.map((link) => (
                <li key={link.href + link.label} className="relative pl-4 text-sm before:absolute before:top-[0.55em] before:left-0 before:size-1.5 before:rounded-full before:bg-[#da2c46] before:content-['']">
                  <Link className="text-[#b6bbc0] transition-colors hover:text-white" href={link.href}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="relative mb-6 pb-3 text-lg font-bold text-white after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-10 after:bg-[#da2c46] after:content-['']">
              Newslette
            </h4>
            <p className="mb-4 text-sm" style={{ color: LEGACY_MUTED }}>
              Get in your inbox the latest News
            </p>
            <form className="space-y-3" onSubmit={onNewsletterSubmit} noValidate>
              <label className="relative block">
                <span className="sr-only">Your Name</span>
                <User className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#b6bbc0]" aria-hidden="true" />
                <input
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  className="h-11 w-full border border-white/15 bg-transparent pl-10 pr-3 text-sm text-white outline-none placeholder:text-[#b6bbc0] focus:border-[#da2c46]"
                  required
                />
              </label>
              <label className="relative block">
                <span className="sr-only">Email address</span>
                <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#b6bbc0]" aria-hidden="true" />
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="h-11 w-full border border-white/15 bg-transparent pl-10 pr-3 text-sm text-white outline-none placeholder:text-[#b6bbc0] focus:border-[#da2c46]"
                  required
                />
              </label>
              <button
                type="submit"
                className="inline-block px-[28px] py-[10px] text-base font-bold text-white transition hover:opacity-90"
                style={{ background: LEGACY_NAVY }}
              >
                subscribe
              </button>
              {message ? (
                <p className="text-xs text-white/80" role="status">
                  {message}
                </p>
              ) : null}
            </form>
          </div>
        </div>
      </div>
      <div className="px-4 py-5 text-center text-sm sm:px-6" style={{ color: LEGACY_MUTED }}>
        <p>
          © 2023{" "}
          <Link href="/" className="text-white hover:text-[#da2c46]">
            UniqueSkyWay
          </Link>{" "}
          - Business &amp; Consulting. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
