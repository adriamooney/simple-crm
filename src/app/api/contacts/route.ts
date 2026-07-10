import { NextResponse } from "next/server";

import { ReconnectRequiredError } from "@/lib/errors";
import { getContacts } from "@/lib/google";

export const runtime = "nodejs";

export async function GET() {
  try {
    const contacts = await getContacts();
    return NextResponse.json({ contacts });
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
