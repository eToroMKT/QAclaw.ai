import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { auth } from "@/lib/auth";
import { createTestCycleFromInput } from "@/lib/test-cycle-create";

export async function GET() {
  const cycles = await prisma.testCycle.findMany({
    include: { project: { select: { id: true, name: true, slug: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(cycles);
}

export async function POST(req: NextRequest) {
  const hasApiKey = req.headers.get("authorization")?.startsWith("Bearer ");
  if (hasApiKey) {
    const { response } = await requireAuth(req);
    if (response) return response;
  } else {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const body = await req.json();
    const cycle = await createTestCycleFromInput(body);
    return NextResponse.json(cycle, { status: 201 });
  } catch (error: any) {
    const message = error?.message || "Failed to create cycle";
    const status = message === 'Project not found' ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
