import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { dispatchWebhook } from "@/lib/webhook-dispatcher";
import { calculatePriorityScore, shouldBlockRelease } from "@/lib/priority-scoring";
import { evaluateEscalationRules } from "@/lib/escalation-engine";

export async function GET(req: NextRequest) {
  const cycleId = req.nextUrl.searchParams.get("cycleId");
  const severity = req.nextUrl.searchParams.get("severity");
  const status = req.nextUrl.searchParams.get("status");
  const sortBy = req.nextUrl.searchParams.get("sortBy") || "createdAt";
  const sortOrder = req.nextUrl.searchParams.get("sortOrder") || "desc";

  const where: any = {};
  if (cycleId) where.cycleId = cycleId;
  if (severity) where.severity = severity;
  if (status) where.status = status;

  const orderBy: any = {};
  if (sortBy === "priorityScore") orderBy.priorityScore = sortOrder;
  else if (sortBy === "severity") orderBy.severity = sortOrder;
  else orderBy.createdAt = sortOrder;

  const bugs = await prisma.bugReport.findMany({ where, orderBy });
  return NextResponse.json(bugs);
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireAuth(req);
  if (response) return response;

  try {
    const body = await req.json();
    const { cycleId, title, severity, stepsToReproduce, expectedResult, actualResult, deviceInfo, screenshotUrls } = body;

    if (!cycleId || !title || !severity) {
      return NextResponse.json({ error: "Missing required fields: cycleId, title, severity" }, { status: 400 });
    }

    const cycle = await prisma.testCycle.findUnique({ where: { id: cycleId } });
    if (!cycle) {
      return NextResponse.json({ error: "Test cycle not found" }, { status: 404 });
    }

    const deviceInfoStr = JSON.stringify(deviceInfo || {});
    const priorityScore = calculatePriorityScore(severity, deviceInfoStr);
    const releaseBlocker = shouldBlockRelease(severity);

    const bug = await prisma.bugReport.create({
      data: {
        cycleId,
        reporterId: user!.id,
        title,
        severity,
        stepsToReproduce: stepsToReproduce || "",
        expectedResult: expectedResult || "",
        actualResult: actualResult || "",
        deviceInfo: deviceInfoStr,
        screenshotUrls: JSON.stringify(screenshotUrls || []),
        priorityScore,
        releaseBlocker,
      },
    });

    // Evaluate escalation rules async
    evaluateEscalationRules({
      id: bug.id,
      cycleId: bug.cycleId,
      severity: bug.severity,
      deviceInfo: bug.deviceInfo,
      status: bug.status,
    }).catch(() => {});

    dispatchWebhook("bug_report.created", bug, user!.id);
    return NextResponse.json(bug, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
