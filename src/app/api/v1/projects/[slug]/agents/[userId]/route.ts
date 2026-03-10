import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string; userId: string }> }) {
  const { user, response } = await requireAuth(req);
  if (response) return response;

  const { slug, userId } = await params;
  const project = await prisma.project.findUnique({ where: { slug } });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  try {
    await prisma.agentAssignment.delete({
      where: { projectId_userId: { projectId: project.id, userId } },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }
}
