import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";

export async function GET() {
  const cycles = await prisma.testCycle.findMany({
    include: { project: { select: { id: true, name: true, slug: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(cycles);
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireAuth(req);
  if (response) return response;

  try {
    const body = await req.json();
    const { projectId, title, description, targetUrl, priority, steps, deviceRequirements } = body;

    if (!projectId || !title || !targetUrl || !steps?.length) {
      return NextResponse.json(
        { error: "Missing required fields: projectId, title, targetUrl, steps" },
        { status: 400 }
      );
    }

    // Verify project exists
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const cycle = await prisma.testCycle.create({
      data: {
        projectId,
        title,
        description: description || "",
        targetUrl,
        priority: priority || "normal",
        stepsJson: JSON.stringify(steps),
        deviceReqs: JSON.stringify(deviceRequirements || []),
      },
    });

    return NextResponse.json(cycle, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
