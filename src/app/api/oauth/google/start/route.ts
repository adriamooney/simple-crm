import { NextRequest, NextResponse } from "next/server";

import { buildAuthUrl } from "@/lib/google-oauth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const slotParam = request.nextUrl.searchParams.get("slot");
  const slot = slotParam === "2" ? 2 : 1;

  const { url } = buildAuthUrl(slot);
  return NextResponse.redirect(url);
}

