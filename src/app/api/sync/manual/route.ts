import { NextResponse } from "next/server";

import { syncCrmFromGmail } from "@/lib/crm";
import { ReconnectRequiredError } from "@/lib/errors";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST() {
  try {
    const result = await syncCrmFromGmail();
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ReconnectRequiredError) {
      return NextResponse.json(
        { error: error.message, reconnect: true, slot: error.slot },
        { status: 401 },
      );
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
