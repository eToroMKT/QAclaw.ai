import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cycles = await prisma.testCycle.findMany({
    include: { project: { select: { id: true, name: true, slug: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(cycles);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { projectId, title, description, targetUrl, priority, steps, deviceRequirements } = body;

  if (!projectId || !title || !targetUrl || !steps?.length) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const cycle = await prisma.testCycle.create({
    data: {
      projectId, title, description: description || "",
      targetUrl, priority: priority || "normal",
      stepsJson: JSON.stringify(steps),
      deviceReqs: JSON.stringify(deviceRequirements || []),
    },
    include: { project: { select: { name: true, slug: true } } },
  });

  return NextResponse.json(cycle, { status: 201 });
}
