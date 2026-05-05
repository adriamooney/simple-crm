import { NextResponse } from "next/server";

import { listGoogleAccounts } from "@/lib/token-store";

export const runtime = "nodejs";

export async function GET() {
  const accounts = await listGoogleAccounts();
  return NextResponse.json({
    accounts: accounts.map((a) => ({ slot: a.slot, email: a.email, connectedAt: a.connectedAt })),
  });
}

