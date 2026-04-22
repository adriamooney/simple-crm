import { NextRequest, NextResponse } from "next/server";

import { syncCrmFromGmail } from "@/lib/crm";
import { getEnv } from "@/lib/env";

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

  const result = await syncCrmFromGmail();
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  return GET(request);
}
