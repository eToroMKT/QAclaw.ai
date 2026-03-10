import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { user, response } = await requireAuth(req);
  if (response) return response;

  const { bugId } = await req.json();
  if (!bugId) return NextResponse.json({ error: "bugId required" }, { status: 400 });

  const bug = await prisma.bugReport.findUnique({
    where: { id: bugId },
    include: { cycle: { include: { project: true } } },
  });
  if (!bug) return NextResponse.json({ error: "Bug not found" }, { status: 404 });

  // Create a FixAttempt
  const fixAttempt = await prisma.fixAttempt.create({
    data: { bugId, status: "analyzing", notes: "Auto-fix initiated" },
  });

  // Create AutoFixJob
  const job = await prisma.autoFixJob.create({
    data: {
      bugId,
      fixAttemptId: fixAttempt.id,
      status: "analyzing",
      webhookPayload: JSON.stringify({
        bugId: bug.id,
        title: bug.title,
        stepsToReproduce: bug.stepsToReproduce,
        expectedResult: bug.expectedResult,
        actualResult: bug.actualResult,
        deviceInfo: bug.deviceInfo,
        screenshotUrls: bug.screenshotUrls,
        project: bug.cycle.project.name,
        targetUrl: bug.cycle.project.targetUrl,
      }),
    },
  });

  return NextResponse.json({ jobId: job.id, fixAttemptId: fixAttempt.id, status: "analyzing" });
}
