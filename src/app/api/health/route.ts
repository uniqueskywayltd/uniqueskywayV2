import { NextResponse } from "next/server";

import { APP_METADATA } from "@/config/constants";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    status: "ok",
    service: APP_METADATA.packageName,
    version: APP_METADATA.version,
    time: new Date().toISOString(),
    basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? "",
  });
}
