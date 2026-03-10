import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { dispatchWebhook } from "@/lib/webhook-dispatcher";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // CrowdTesting webhook payload — extract bug reports and test results
    const { event_type, test_cycle_id, bugs, results } = body;

    if (event_type === "bugs_found" && bugs?.length) {
      // Find the cycle to get the project owner for webhook dispatch
      const cycle = await prisma.testCycle.findFirst({
        where: { id: test_cycle_id },
        include: { project: { include: { owner: true } } },
      });

      for (const bug of bugs) {
        const created = await prisma.bugReport.create({
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

        if (cycle?.project?.ownerId) {
          dispatchWebhook("bug_report.created", created, cycle.project.ownerId);
        }
      }
    }

    if (event_type === "cycle_completed" && test_cycle_id) {
      await prisma.testCycle.update({
        where: { id: test_cycle_id },
        data: { status: "completed" },
      }).catch(() => {});

      const cycle = await prisma.testCycle.findFirst({
        where: { id: test_cycle_id },
        include: { project: true },
      });

      if (cycle?.project?.ownerId) {
        dispatchWebhook("test_cycle.completed", { cycleId: test_cycle_id }, cycle.project.ownerId);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
