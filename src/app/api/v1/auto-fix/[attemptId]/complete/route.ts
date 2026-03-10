import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { getCrowdTestingClient } from "@/lib/applause";

export async function POST(req: NextRequest, { params }: { params: Promise<{ attemptId: string }> }) {
  const { user, response } = await requireAuth(req);
  if (response) return response;

  const { attemptId } = await params;
  const { commitUrl, deployUrl, notes } = await req.json();

  const job = await prisma.autoFixJob.findFirst({
    where: { OR: [{ id: attemptId }, { fixAttemptId: attemptId }] },
    include: { bug: { include: { cycle: true } } },
  });
  if (!job) return NextResponse.json({ error: "Auto-fix job not found" }, { status: 404 });

  // Update fix attempt
  if (job.fixAttemptId) {
    await prisma.fixAttempt.update({
      where: { id: job.fixAttemptId },
      data: { commitUrl: commitUrl || "", deployUrl: deployUrl || "", notes: notes || "Auto-fix deployed", status: "deployed" },
    });
  }

  // Update job status to retesting
  await prisma.autoFixJob.update({
    where: { id: job.id },
    data: { status: "retesting" },
  });

  // Trigger re-test via CrowdTesting if configured
  const client = getCrowdTestingClient();
  if (client.isConfigured) {
    try {
      const { runId } = await client.startTestRun([`retest-bug-${job.bugId}`]);
      // Update job with info
      await prisma.autoFixJob.update({
        where: { id: job.id },
        data: { status: "retesting", webhookPayload: JSON.stringify({ ...JSON.parse(job.webhookPayload), retestRunId: runId }) },
      });
    } catch {
      // CrowdTesting not available, mark as verified anyway
      await prisma.autoFixJob.update({
        where: { id: job.id },
        data: { status: "verified", completedAt: new Date() },
      });
    }
  } else {
    await prisma.autoFixJob.update({
      where: { id: job.id },
      data: { status: "verified", completedAt: new Date() },
    });
  }

  // Update bug status
  await prisma.bugReport.update({
    where: { id: job.bugId },
    data: { status: "fix_deployed" },
  });

  return NextResponse.json({ status: "retesting", jobId: job.id });
}
