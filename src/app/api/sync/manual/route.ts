import { NextResponse } from "next/server";

import { syncCrmFromGmail } from "@/lib/crm";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST() {
  const result = await syncCrmFromGmail();
  return NextResponse.json(result);
}
