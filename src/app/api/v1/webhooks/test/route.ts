import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { createHmac } from "crypto";

export async function POST(req: NextRequest) {
  const { user, response } = await requireAuth(req);
  if (response) return response;

  const { url, secret } = await req.json();
  if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });

  const payload = JSON.stringify({ event: "test.ping", data: { message: "ClawQA webhook test" }, timestamp: new Date().toISOString() });
  const sig = createHmac("sha256", secret || "test").update(payload).digest("hex");

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-ClawQA-Signature": `sha256=${sig}` },
      body: payload,
      signal: AbortSignal.timeout(10000),
    });
    return NextResponse.json({ success: res.ok, statusCode: res.status });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 502 });
  }
}
