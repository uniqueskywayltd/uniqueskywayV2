export type MarketTickerQuote = {
  pair: string;
  rate: number;
  changePercent: number;
};

type FrankfurterResponse = {
  amount: number;
  base: string;
  date: string;
  rates: Record<string, number>;
};

type OpenErApiResponse = {
  result?: string;
  rates?: Record<string, number>;
};

type CoinGeckoSimplePrice = Record<
  string,
  { usd?: number; usd_24h_change?: number }
>;

const FALLBACK_QUOTES: MarketTickerQuote[] = [
  { pair: "GBP/USD", rate: 1.274, changePercent: 0 },
  { pair: "EUR/USD", rate: 1.0852, changePercent: 0 },
  { pair: "USD/JPY", rate: 156.42, changePercent: 0 },
  { pair: "USD/NGN", rate: 1485, changePercent: 0 },
  { pair: "BTC/USD", rate: 64250, changePercent: 0 },
  { pair: "ETH/USD", rate: 3420, changePercent: 0 },
];

function previousBusinessDay(from = new Date()): string {
  const date = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  do {
    date.setUTCDate(date.getUTCDate() - 1);
  } while (date.getUTCDay() === 0 || date.getUTCDay() === 6);
  return date.toISOString().slice(0, 10);
}

function percentChange(current: number, previous: number): number {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) {
    return 0;
  }
  return ((current - previous) / previous) * 100;
}

function invertRate(rate: number): number {
  return rate > 0 ? 1 / rate : 0;
}

async function fetchJson<T>(url: string, revalidateSeconds: number): Promise<T | null> {
  try {
    const response = await fetch(url, {
      next: { revalidate: revalidateSeconds },
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

async function fetchFxQuotes(): Promise<MarketTickerQuote[]> {
  const priorDate = previousBusinessDay();
  const [latest, prior, ngnLatest] = await Promise.all([
    fetchJson<FrankfurterResponse>(
      "https://api.frankfurter.dev/v1/latest?from=USD&to=EUR,GBP,JPY",
      3600,
    ),
    fetchJson<FrankfurterResponse>(
      `https://api.frankfurter.dev/v1/${priorDate}?from=USD&to=EUR,GBP,JPY`,
      3600,
    ),
    fetchJson<OpenErApiResponse>("https://open.er-api.com/v6/latest/USD", 3600),
  ]);

  if (!latest?.rates) return [];

  const quotes: MarketTickerQuote[] = [];

  const gbpPerUsd = latest.rates.GBP;
  const eurPerUsd = latest.rates.EUR;
  const usdJpy = latest.rates.JPY;

  if (typeof gbpPerUsd === "number" && gbpPerUsd > 0) {
    const gbpUsd = invertRate(gbpPerUsd);
    const priorGbpPerUsd = prior?.rates?.GBP;
    const priorGbpUsd =
      typeof priorGbpPerUsd === "number" && priorGbpPerUsd > 0
        ? invertRate(priorGbpPerUsd)
        : gbpUsd;
    quotes.push({
      pair: "GBP/USD",
      rate: gbpUsd,
      changePercent: percentChange(gbpUsd, priorGbpUsd),
    });
  }

  if (typeof eurPerUsd === "number" && eurPerUsd > 0) {
    const eurUsd = invertRate(eurPerUsd);
    const priorEurPerUsd = prior?.rates?.EUR;
    const priorEurUsd =
      typeof priorEurPerUsd === "number" && priorEurPerUsd > 0
        ? invertRate(priorEurPerUsd)
        : eurUsd;
    quotes.push({
      pair: "EUR/USD",
      rate: eurUsd,
      changePercent: percentChange(eurUsd, priorEurUsd),
    });
  }

  if (typeof usdJpy === "number" && usdJpy > 0) {
    const priorUsdJpy =
      typeof prior?.rates?.JPY === "number" && prior.rates.JPY > 0
        ? prior.rates.JPY
        : usdJpy;
    quotes.push({
      pair: "USD/JPY",
      rate: usdJpy,
      changePercent: percentChange(usdJpy, priorUsdJpy),
    });
  }

  const ngn = ngnLatest?.rates?.NGN;
  if (typeof ngn === "number" && ngn > 0) {
    quotes.push({ pair: "USD/NGN", rate: ngn, changePercent: 0 });
  }

  return quotes;
}

async function fetchCryptoQuotes(): Promise<MarketTickerQuote[]> {
  const data = await fetchJson<CoinGeckoSimplePrice>(
    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true",
    300,
  );
  if (!data) return [];

  const quotes: MarketTickerQuote[] = [];
  if (typeof data.bitcoin?.usd === "number") {
    quotes.push({
      pair: "BTC/USD",
      rate: data.bitcoin.usd,
      changePercent: data.bitcoin.usd_24h_change ?? 0,
    });
  }
  if (typeof data.ethereum?.usd === "number") {
    quotes.push({
      pair: "ETH/USD",
      rate: data.ethereum.usd,
      changePercent: data.ethereum.usd_24h_change ?? 0,
    });
  }
  return quotes;
}

export function formatTickerRate(pair: string, rate: number): string {
  if (pair === "GBP/USD" || pair === "EUR/USD") {
    return rate.toFixed(4);
  }
  if (rate >= 1000) {
    return rate.toLocaleString("en-US", { maximumFractionDigits: 0 });
  }
  return rate.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatTickerChange(changePercent: number): string {
  const sign = changePercent >= 0 ? "+" : "";
  return `${sign}${changePercent.toFixed(2)}%`;
}

/**
 * Daily FX (ECB via Frankfurter + open.er-api for NGN) and crypto (CoinGecko 24h).
 */
export async function getDailyMarketQuotes(): Promise<{
  quotes: MarketTickerQuote[];
  asOf: string;
  source: string;
}> {
  const [fx, crypto] = await Promise.all([fetchFxQuotes(), fetchCryptoQuotes()]);
  const quotes = [...fx, ...crypto];

  if (quotes.length === 0) {
    return {
      quotes: FALLBACK_QUOTES,
      asOf: new Date().toISOString(),
      source: "fallback",
    };
  }

  return {
    quotes,
    asOf: new Date().toISOString(),
    source: "daily",
  };
}
