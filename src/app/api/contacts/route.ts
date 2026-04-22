import { NextResponse } from "next/server";

import { getContacts } from "@/lib/google";

export const runtime = "nodejs";

export async function GET() {
  try {
    const contacts = await getContacts();
    return NextResponse.json({ contacts });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
