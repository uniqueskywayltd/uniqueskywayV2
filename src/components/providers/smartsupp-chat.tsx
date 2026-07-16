"use client";

import Script from "next/script";

declare global {
  interface Window {
    _smartsupp?: { key?: string; cookieDomain?: string };
    smartsupp?: ((...args: unknown[]) => void) & { _?: unknown[] };
    __uswSmartsuppBootstrapped?: boolean;
  }
}

const SMARTSUPP_SCRIPT_ID = "smartsupp-chat";

/** Public Smartsupp key — overridable via NEXT_PUBLIC_SMARTSUPP_KEY. */
const DEFAULT_SMARTSUPP_KEY = "4cf108be304dbac7ea939de8640da0333d38167f";

/**
 * Global Smartsupp chat — loaded once via next/script (afterInteractive).
 * Available on all public, customer, and admin surfaces.
 */
export function SmartsuppChat() {
  const smartsuppKey = process.env.NEXT_PUBLIC_SMARTSUPP_KEY?.trim() || DEFAULT_SMARTSUPP_KEY;

  return (
    <Script
      id={SMARTSUPP_SCRIPT_ID}
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
(function () {
  if (typeof window === "undefined") return;
  if (window.__uswSmartsuppBootstrapped) return;
  window.__uswSmartsuppBootstrapped = true;
  if (window.smartsupp) return;
  var key = ${JSON.stringify(smartsuppKey)};
  if (!key) return;
  var _smartsupp = window._smartsupp || {};
  _smartsupp.key = key;
  var host = window.location.hostname || "";
  if (host === "uniqueskyway.com" || host.endsWith(".uniqueskyway.com")) {
    _smartsupp.cookieDomain = ".uniqueskyway.com";
  }
  window._smartsupp = _smartsupp;
  window.smartsupp || (function (d) {
    var s, c, o = smartsupp = function () { o._.push(arguments); };
    o._ = [];
    s = d.getElementsByTagName("script")[0];
    c = d.createElement("script");
    c.type = "text/javascript";
    c.charset = "utf-8";
    c.async = true;
    c.src = "https://www.smartsuppchat.com/loader.js?";
    s.parentNode.insertBefore(c, s);
  })(document);
})();
        `.trim(),
      }}
    />
  );
}
