import { NextResponse } from "next/server";

import { getSocialProofEvents } from "@/application/public/social-proof-service";

export const runtime = "nodejs";

export async function GET() {
  try {
    const events = await getSocialProofEvents();
    return NextResponse.json(
      { events },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { events: [] },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  }
}
