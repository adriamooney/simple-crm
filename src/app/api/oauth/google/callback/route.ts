import { NextRequest, NextResponse } from "next/server";

import { handleOAuthCallback, verifyState } from "@/lib/google-oauth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const error = request.nextUrl.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(`/settings?oauth=error&reason=${encodeURIComponent(error)}`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`/settings?oauth=error&reason=${encodeURIComponent("Missing code/state")}`);
  }

  try {
    const parsed = verifyState(state);
    await handleOAuthCallback({ code, slot: parsed.slot });
    return NextResponse.redirect(`/settings?oauth=success&slot=${parsed.slot}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.redirect(`/settings?oauth=error&reason=${encodeURIComponent(message)}`);
  }
}

