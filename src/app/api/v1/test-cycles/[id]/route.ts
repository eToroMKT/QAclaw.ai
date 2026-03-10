import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cycle = await prisma.testCycle.findUnique({
    where: { id },
    include: { project: { select: { id: true, name: true, slug: true } }, bugReports: true, testExecutions: true },
  });
  if (!cycle) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(cycle);
}
