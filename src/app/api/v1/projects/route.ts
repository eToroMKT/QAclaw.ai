import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { auth } from "@/lib/auth";

export async function GET() {
  const projects = await prisma.project.findMany({
    include: { testCycles: { select: { id: true, title: true, priority: true, status: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  // Support both API key auth and session cookie auth
  let authedUser: any = null;
  const hasApiKey = req.headers.get("authorization")?.startsWith("Bearer ");

  if (hasApiKey) {
    const { user, response } = await requireAuth(req);
    if (response) return response;
    authedUser = user;
  } else {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const role = (session.user as any)?.role || "tester";
    if (role !== "agent-owner" && role !== "admin") {
      return NextResponse.json({ error: "Forbidden: only agent-owner or admin can create projects" }, { status: 403 });
    }
    authedUser = { id: session.user.id };
  }

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
        ownerId: authedUser!.id,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
