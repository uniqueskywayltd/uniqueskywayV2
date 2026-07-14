export const LEGACY_PRIMARY_NAV = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Investments", href: "/plans" },
  { label: "Question Guide", href: "/faq" },
] as const;

export const LEGACY_ACCOUNT_LINKS = [
  { label: "Register", href: "/auth/register" },
  { label: "Login", href: "/auth/login" },
] as const;

export const LEGACY_USEFUL_LINKS = [
  { label: "About Us", href: "/about" },
  { label: "home", href: "/" },
  { label: "Register", href: "/auth/register" },
  { label: "Login", href: "/auth/login" },
] as const;

/** Static FX display only — native ticker lookalike, not a live vendor feed. */
export const LEGACY_CURRENCY_TICKER_ROWS = [
  { pair: "GBP/USD", rate: "1.2740", change: "+0.12%" },
  { pair: "EUR/USD", rate: "1.0852", change: "-0.08%" },
  { pair: "USD/JPY", rate: "156.42", change: "+0.21%" },
  { pair: "USD/NGN", rate: "1485.00", change: "+0.05%" },
  { pair: "BTC/USD", rate: "64250", change: "+1.40%" },
  { pair: "ETH/USD", rate: "3420", change: "-0.55%" },
] as const;
