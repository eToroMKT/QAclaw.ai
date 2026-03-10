import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  const { user, response } = await requireAuth(req);
  if (response) return response;

  const { projectId, owner, repo } = await req.json();
  if (!projectId || !owner || !repo) return NextResponse.json({ error: "projectId, owner, repo required" }, { status: 400 });

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const secret = randomBytes(32).toString("hex");
  const updated = await prisma.project.update({
    where: { id: projectId },
    data: { githubOwner: owner, githubRepo: repo, githubWebhookSecret: secret },
  });

  return NextResponse.json({
    success: true,
    webhookUrl: "/api/v1/github/webhook",
    webhookSecret: secret,
    repo: `${owner}/${repo}`,
  }, { status: 201 });
}
