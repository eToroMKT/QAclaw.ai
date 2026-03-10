import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId");
  const where = projectId ? { projectId } : {};
  const plans = await prisma.testPlan.findMany({
    where,
    include: { project: { select: { id: true, name: true, slug: true } }, createdBy: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(plans);
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireAuth(req);
  if (response) return response;

  try {
    const body = await req.json();
    const { projectId, title, description, steps, deviceRequirements, browserRequirements, priority } = body;

    if (!projectId || !title) {
      return NextResponse.json({ error: "Missing required fields: projectId, title" }, { status: 400 });
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const plan = await prisma.testPlan.create({
      data: {
        projectId,
        title,
        description: description || "",
        stepsJson: JSON.stringify(steps || []),
        deviceReqs: JSON.stringify(deviceRequirements || []),
        browserReqs: JSON.stringify(browserRequirements || []),
        priority: priority || "normal",
        createdById: user!.id,
      },
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const { user, response } = await requireAuth(req);
  if (response) return response;

  try {
    const body = await req.json();
    const { id, title, description, steps, deviceRequirements, browserRequirements, priority } = body;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const existing = await prisma.testPlan.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Test plan not found" }, { status: 404 });

    // Save history
    await prisma.testPlanHistory.create({
      data: {
        testPlanId: existing.id,
        version: existing.version,
        title: existing.title,
        description: existing.description,
        stepsJson: existing.stepsJson,
        deviceReqs: existing.deviceReqs,
        browserReqs: existing.browserReqs,
        priority: existing.priority,
      },
    });

    const updated = await prisma.testPlan.update({
      where: { id },
      data: {
        title: title ?? existing.title,
        description: description ?? existing.description,
        stepsJson: steps ? JSON.stringify(steps) : existing.stepsJson,
        deviceReqs: deviceRequirements ? JSON.stringify(deviceRequirements) : existing.deviceReqs,
        browserReqs: browserRequirements ? JSON.stringify(browserRequirements) : existing.browserReqs,
        priority: priority ?? existing.priority,
        version: existing.version + 1,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
