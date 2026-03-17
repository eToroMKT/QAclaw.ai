import { NextResponse } from "next/server";
import { getCrowdTestingClient } from "@/lib/applause";
import { getRuntimeFlags } from "@/lib/runtime-flags";

export async function GET() {
  const client = getCrowdTestingClient();
  const flags = await getRuntimeFlags();

  if (!client.isConfigured) {
    return NextResponse.json({
      configured: false,
      reachable: false,
      applauseAutoCreateOnEscalate: flags.applauseAutoCreateOnEscalate,
      escalationMode: flags.applauseAutoCreateOnEscalate ? 'auto_create_on_escalate' : 'manual_handoff',
    });
  }
  try {
    const res = await fetch("https://prod-auto-api.cloud.applause.com:443/api/v1.0/test-run/0", {
      method: "GET",
      headers: { "X-Api-Key": process.env.APPLAUSE_API_KEY || "" },
      signal: AbortSignal.timeout(5000),
    });
    // Any response (even 404) means reachable
    return NextResponse.json({
      configured: true,
      reachable: true,
      applauseAutoCreateOnEscalate: flags.applauseAutoCreateOnEscalate,
      escalationMode: flags.applauseAutoCreateOnEscalate ? 'auto_create_on_escalate' : 'manual_handoff',
    });
  } catch {
    return NextResponse.json({
      configured: true,
      reachable: false,
      applauseAutoCreateOnEscalate: flags.applauseAutoCreateOnEscalate,
      escalationMode: flags.applauseAutoCreateOnEscalate ? 'auto_create_on_escalate' : 'manual_handoff',
    });
  }
}
