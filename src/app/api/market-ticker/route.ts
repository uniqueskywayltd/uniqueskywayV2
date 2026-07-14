import { NextResponse } from "next/server";

import { getDailyMarketQuotes } from "@/lib/market/daily-exchange-rates";

export async function GET() {
  const { quotes, asOf, source } = await getDailyMarketQuotes();

  return NextResponse.json(
    {
      enabled: quotes.length > 0,
      quotes,
      lastUpdated: asOf,
      source,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
      },
    },
  );
}
