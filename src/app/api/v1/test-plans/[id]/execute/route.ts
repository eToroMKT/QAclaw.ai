import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth(req);
  if (response) return response;

  const { id } = await params;
  const plan = await prisma.testPlan.findUnique({ where: { id }, include: { project: true } });
  if (!plan) return NextResponse.json({ error: "Test plan not found" }, { status: 404 });

  const cycle = await prisma.testCycle.create({
    data: {
      projectId: plan.projectId,
      title: `[${plan.title}] v${plan.version} - ${new Date().toISOString().slice(0,10)}`,
      description: plan.description,
      targetUrl: plan.project.targetUrl || "",
      priority: plan.priority,
      stepsJson: plan.stepsJson,
      deviceReqs: plan.deviceReqs,
      createdById: user!.id,
    },
  });

  return NextResponse.json({ testCycle: cycle, fromPlan: plan.id, planVersion: plan.version }, { status: 201 });
}
