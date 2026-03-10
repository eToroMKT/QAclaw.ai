import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ attemptId: string }> }) {
  const { user, response } = await requireAuth(req);
  if (response) return response;

  const { attemptId } = await params;
  const job = await prisma.autoFixJob.findFirst({
    where: { OR: [{ id: attemptId }, { fixAttemptId: attemptId }] },
    include: { bug: true, fixAttempt: true },
  });
  if (!job) return NextResponse.json({ error: "Auto-fix job not found" }, { status: 404 });

  return NextResponse.json({
    id: job.id,
    bugId: job.bugId,
    fixAttemptId: job.fixAttemptId,
    status: job.status,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
    retryCount: job.retryCount,
    bug: { title: job.bug.title, severity: job.bug.severity },
    fixAttempt: job.fixAttempt ? { commitUrl: job.fixAttempt.commitUrl, deployUrl: job.fixAttempt.deployUrl } : null,
  });
}
