import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type") || "overview";

  if (type === "overview") {
    const totalBugs = await prisma.bugReport.count();
    const openBugs = await prisma.bugReport.count({ where: { status: { not: "fixed" } } });
    const fixedBugs = await prisma.bugReport.count({ where: { status: "fixed" } });
    
    const allBugs = await prisma.bugReport.findMany({ select: { severity: true, cycleId: true, status: true, createdAt: true, updatedAt: true } });
    const bugsBySeverity: Record<string, number> = {};
    allBugs.forEach(b => { bugsBySeverity[b.severity] = (bugsBySeverity[b.severity] || 0) + 1; });

    const bugsPerCycle: Record<string, number> = {};
    allBugs.forEach(b => { bugsPerCycle[b.cycleId] = (bugsPerCycle[b.cycleId] || 0) + 1; });

    const projects = await prisma.project.findMany({ include: { testCycles: { include: { bugReports: true } } } });
    const bugsPerProject = projects.map(p => ({
      projectId: p.id, name: p.name,
      bugCount: p.testCycles.reduce((sum, c) => sum + c.bugReports.length, 0),
    }));

    const fixAttempts = await prisma.fixAttempt.findMany();
    const successfulFixes = fixAttempts.filter(f => f.status === "verified" || f.status === "success").length;
    const fixSuccessRate = fixAttempts.length > 0 ? (successfulFixes / fixAttempts.length * 100).toFixed(1) : "0";

    // Avg time to fix (fixed bugs only, updatedAt - createdAt)
    const fixedBugsList = await prisma.bugReport.findMany({ where: { status: "fixed" } });
    const avgMs = fixedBugsList.length > 0
      ? fixedBugsList.reduce((s, b) => s + (b.updatedAt.getTime() - b.createdAt.getTime()), 0) / fixedBugsList.length
      : 0;
    const avgTimeToFix = Math.round(avgMs / 3600000 * 10) / 10; // hours

    return NextResponse.json({
      totalBugs, openBugs, fixedBugs, bugsBySeverity, bugsPerProject, bugsPerCycle,
      openVsClosed: { open: openBugs, closed: fixedBugs },
      fixSuccessRate: parseFloat(fixSuccessRate),
      avgTimeToFix,
    });
  }

  if (type === "trends") {
    const since = new Date(Date.now() - 30 * 86400000);
    const bugs = await prisma.bugReport.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, status: true, updatedAt: true },
    });

    const daily: Record<string, { created: number; resolved: number }> = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      daily[d] = { created: 0, resolved: 0 };
    }
    bugs.forEach(b => {
      const cd = b.createdAt.toISOString().slice(0, 10);
      if (daily[cd]) daily[cd].created++;
      if (b.status === "fixed") {
        const rd = b.updatedAt.toISOString().slice(0, 10);
        if (daily[rd]) daily[rd].resolved++;
      }
    });

    return NextResponse.json({ daily: Object.entries(daily).sort().map(([date, v]) => ({ date, ...v })) });
  }

  return NextResponse.json({ error: "Invalid type. Use overview or trends" }, { status: 400 });
}
