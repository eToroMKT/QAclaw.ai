import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ prNumber: string }> }) {
  const { prNumber } = await params;
  const num = parseInt(prNumber);
  if (isNaN(num)) return NextResponse.json({ error: "Invalid PR number" }, { status: 400 });

  const cycles = await prisma.testCycle.findMany({
    where: { prNumber: num },
    include: { bugReports: { select: { id: true, severity: true, status: true } } },
  });

  if (!cycles.length) return NextResponse.json({ error: "No test cycles for this PR" }, { status: 404 });

  const totalBugs = cycles.reduce((s, c) => s + c.bugReports.length, 0);
  const openBugs = cycles.reduce((s, c) => s + c.bugReports.filter(b => b.status !== "fixed").length, 0);

  return NextResponse.json({
    prNumber: num,
    cycles: cycles.map(c => ({ id: c.id, title: c.title, status: c.status, bugCount: c.bugReports.length })),
    totalBugs,
    openBugs,
    status: openBugs > 0 ? "issues_found" : totalBugs > 0 ? "all_fixed" : "clean",
  });
}
