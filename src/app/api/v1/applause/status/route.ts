import { NextResponse } from "next/server";
import { getCrowdTestingClient } from "@/lib/applause";

export async function GET() {
  const client = getCrowdTestingClient();
  if (!client.isConfigured) {
    return NextResponse.json({ configured: false, reachable: false });
  }
  try {
    const res = await fetch("https://prod-auto-api.cloud.applause.com:443/api/v1.0/test-run/0", {
      method: "GET",
      headers: { "X-Api-Key": process.env.APPLAUSE_API_KEY || "" },
      signal: AbortSignal.timeout(5000),
    });
    // Any response (even 404) means reachable
    return NextResponse.json({ configured: true, reachable: true });
  } catch {
    return NextResponse.json({ configured: true, reachable: false });
  }
}
