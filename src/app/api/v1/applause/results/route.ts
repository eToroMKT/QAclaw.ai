import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { user, response } = await requireAuth(req);
  if (response) return response;

  const { cycleId } = await req.json();
  if (!cycleId) return NextResponse.json({ error: "cycleId required" }, { status: 400 });

  const cycle = await prisma.testCycle.findUnique({ where: { id: cycleId } });
  if (!cycle) return NextResponse.json({ error: "Cycle not found" }, { status: 404 });

  // In a real integration we'd poll Testing API for results.
  // For now, this creates bug reports from any test executions marked as failed.
  const executions = await prisma.testExecution.findMany({
    where: { cycleId, status: "failed" },
    include: { tester: true },
  });

  const created: string[] = [];
  for (const exec of executions) {
    const existing = await prisma.bugReport.findFirst({
      where: { cycleId, title: { startsWith: `[CrowdTesting Sync]` }, reporterId: exec.testerId },
    });
    if (existing) continue;

    let results: any[] = [];
    try { results = JSON.parse(exec.resultsJson); } catch {}
    const failedSteps = results.filter((r: any) => r.status === "fail" || r.result === "fail");

    const bug = await prisma.bugReport.create({
      data: {
        cycleId,
        reporterId: exec.testerId,
        title: `[CrowdTesting Sync] Failed execution ${exec.id.slice(0, 8)}`,
        severity: "major",
        status: "new",
        stepsToReproduce: failedSteps.map((s: any) => s.note || s.comment || "Failed step").join("\n"),
        actualResult: "Test execution failed",
        expectedResult: "Test should pass",
      },
    });
    created.push(bug.id);
  }

  return NextResponse.json({ synced: created.length, bugIds: created });
}
