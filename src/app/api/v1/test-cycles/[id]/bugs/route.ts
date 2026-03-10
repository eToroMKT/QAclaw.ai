import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const cycle = await prisma.testCycle.findUnique({ where: { id } });
  if (!cycle) {
    return NextResponse.json({ error: "Test cycle not found" }, { status: 404 });
  }

  const bugs = await prisma.bugReport.findMany({
    where: { cycleId: id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(bugs);
}
