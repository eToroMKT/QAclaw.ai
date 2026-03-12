import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { dispatchWebhook } from "@/lib/webhook-dispatcher";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('[webhook] Received:', JSON.stringify(body).slice(0, 500));

    const { event_type, test_cycle_id, bugs } = body;

    if (event_type === "bugs_found" && bugs?.length) {
      const cycle = await prisma.testCycle.findFirst({
        where: { id: test_cycle_id },
        include: { project: { include: { owner: true } } },
      });
      console.log('[webhook] Cycle found:', cycle?.id, 'Owner:', cycle?.project?.ownerId);

      const created: string[] = [];
      for (const bug of bugs) {
        try {
          const bugRecord = await prisma.bugReport.create({
            data: {
              cycleId: test_cycle_id || cycle?.id || "",
              reporterId: cycle?.project?.ownerId || "",
              title: bug.title || "CrowdTesting Bug Report",
              severity: bug.severity || "minor",
              stepsToReproduce: bug.stepsToReproduce || bug.description || "",
              expectedResult: bug.expectedResult || "",
              actualResult: bug.actualResult || bug.description || "",
              deviceInfo: JSON.stringify(bug.deviceInfo || {}),
              screenshotUrls: JSON.stringify(bug.screenshots || []),
            },
          });
          created.push(bugRecord.id);
          console.log('[webhook] Bug created:', bugRecord.id);
          if (cycle?.project?.ownerId) {
            dispatchWebhook("bug_report.created", bugRecord, cycle.project.ownerId);
          }
        } catch (bugErr: any) {
          console.error('[webhook] Bug creation failed:', bugErr.message);
        }
      }
      return NextResponse.json({ received: true, bugsCreated: created.length, bugIds: created });
    }

    if (event_type === "cycle_completed" && test_cycle_id) {
      try {
        const updated = await prisma.testCycle.update({
          where: { id: test_cycle_id },
          data: { status: "completed" },
        });
        console.log('[webhook] Cycle updated:', updated.id, '->', updated.status);
      } catch (err: any) {
        console.error('[webhook] Cycle update failed:', err.message);
      }

      const cycle = await prisma.testCycle.findFirst({
        where: { id: test_cycle_id },
        include: { project: true },
      });
      if (cycle?.project?.ownerId) {
        dispatchWebhook("test_cycle.completed", { cycleId: test_cycle_id }, cycle.project.ownerId);
      }
      return NextResponse.json({ received: true, cycleUpdated: true });
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[webhook] Handler error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
