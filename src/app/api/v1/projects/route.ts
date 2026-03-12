import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";

export async function GET() {
  const projects = await prisma.project.findMany({
    include: { testCycles: { select: { id: true, title: true, priority: true, status: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireAuth(req);
  if (response) return response;

  try {
    const body = await req.json();
    const { name, slug, description, targetUrl, repoUrl } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: "Missing required fields: name, slug" }, { status: 400 });
    }

    const existing = await prisma.project.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "Project with this slug already exists", project: existing }, { status: 409 });
    }

    const project = await prisma.project.create({
      data: {
        name,
        slug,
        description: description || "",
        targetUrl: targetUrl || "",
        repoUrl: repoUrl || "",
        ownerId: user!.id,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
