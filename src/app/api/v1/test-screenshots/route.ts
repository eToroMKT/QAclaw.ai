import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const projectSlug = url.searchParams.get("projectSlug");
  const runId = url.searchParams.get("runId");
  const status = url.searchParams.get("status");

  const where: any = {};
  if (projectSlug) {
    const project = await prisma.project.findUnique({ where: { slug: projectSlug } });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    where.projectId = project.id;
  }
  if (runId) where.runId = runId;
  if (status) where.status = status;

  const screenshots = await prisma.screenshot.findMany({
    where,
    include: { project: { select: { name: true, slug: true } } },
    orderBy: { runDate: "desc" },
    take: 200,
  });

  return NextResponse.json(screenshots);
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireAuth(req);
  if (response) return response;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { projectId, projectSlug, testName, status, filePath, runId, runDate } = body;

  let resolvedProjectId = projectId;
  if (!resolvedProjectId && projectSlug) {
    const project = await prisma.project.findUnique({ where: { slug: projectSlug } });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    resolvedProjectId = project.id;
  }

  if (!resolvedProjectId || !testName || !filePath) {
    return NextResponse.json({ error: "projectId/projectSlug, testName, and filePath are required" }, { status: 400 });
  }

  const screenshot = await prisma.screenshot.create({
    data: {
      projectId: resolvedProjectId,
      testName,
      status: status || "pass",
      imageUrl: filePath,
      runId: runId || "manual",
      runDate: runDate ? new Date(runDate) : new Date(),
    },
    include: { project: { select: { name: true, slug: true } } },
  });

  return NextResponse.json(screenshot, { status: 201 });
}
