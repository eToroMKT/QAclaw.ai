import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await prisma.project.findUnique({ where: { slug } });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const assignments = await prisma.agentAssignment.findMany({
    where: { projectId: project.id },
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
  });
  return NextResponse.json(assignments);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { user, response } = await requireAuth(req);
  if (response) return response;

  const { slug } = await params;
  const project = await prisma.project.findUnique({ where: { slug } });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const body = await req.json();
  const { userId, role, permissions } = body;
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const assignment = await prisma.agentAssignment.upsert({
    where: { projectId_userId: { projectId: project.id, userId } },
    update: { role: role || "contributor", permissions: JSON.stringify(permissions || {}) },
    create: { projectId: project.id, userId, role: role || "contributor", permissions: JSON.stringify(permissions || {}) },
  });

  return NextResponse.json(assignment, { status: 201 });
}
