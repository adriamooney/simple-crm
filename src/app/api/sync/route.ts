import { NextRequest, NextResponse } from "next/server";

import { syncCrmFromGmail } from "@/lib/crm";
import { getEnv } from "@/lib/env";
import { ReconnectRequiredError } from "@/lib/errors";

export const runtime = "nodejs";
export const maxDuration = 300;

const isAuthorized = (request: NextRequest): boolean => {
  const env = getEnv();
  const header = request.headers.get("authorization");
  return header === `Bearer ${env.cronSecret}`;
};

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

export async function POST(request: NextRequest) {
  return GET(request);
}
