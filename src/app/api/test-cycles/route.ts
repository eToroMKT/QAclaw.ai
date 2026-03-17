import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { createTestCycleFromInput } from "@/lib/test-cycle-create";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cycles = await prisma.testCycle.findMany({
    include: { project: { select: { id: true, name: true, slug: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(cycles);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
