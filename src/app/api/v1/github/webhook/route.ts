import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";

export async function POST(req: NextRequest) {
  const event = req.headers.get("x-github-event");
  const signature = req.headers.get("x-hub-signature-256");
  const rawBody = await req.text();

  if (event !== "pull_request") return NextResponse.json({ message: "Event ignored" });

  const body = JSON.parse(rawBody);
  const { action, pull_request, repository } = body;

  if (action !== "opened" && action !== "synchronize") return NextResponse.json({ message: "Action ignored" });

  const owner = repository?.owner?.login;
  const repo = repository?.name;
  if (!owner || !repo) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const project = await prisma.project.findFirst({ where: { githubOwner: owner, githubRepo: repo } });
  if (!project) return NextResponse.json({ error: "No linked project" }, { status: 404 });

  // Verify signature if secret exists
  if (project.githubWebhookSecret && signature) {
    const expected = "sha256=" + createHmac("sha256", project.githubWebhookSecret).update(rawBody).digest("hex");
    if (signature !== expected) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const pr = pull_request;
  const cycle = await prisma.testCycle.create({
    data: {
      projectId: project.id,
      title: `PR #${pr.number}: ${pr.title}`,
      description: `Auto-created from PR.\n\n${pr.body || ""}\n\nChanged files context from PR #${pr.number}`,
      targetUrl: pr.html_url || project.targetUrl || "",
      priority: "normal",
      prUrl: pr.html_url || "",
      prNumber: pr.number,
    },
  });

  return NextResponse.json({ message: "Test cycle created", cycleId: cycle.id, prNumber: pr.number }, { status: 201 });
}
