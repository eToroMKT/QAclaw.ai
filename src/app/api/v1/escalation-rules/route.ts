import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId");
  const where = projectId ? { projectId } : {};
  const rules = await prisma.escalationRule.findMany({ where, orderBy: { createdAt: "desc" } });
  return NextResponse.json(rules);
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireAuth(req);
  if (response) return response;
  try {
    const body = await req.json();
    const { projectId, condition, action, targetUrl } = body;
    if (!projectId || !condition || !action) {
      return NextResponse.json({ error: "Missing required fields: projectId, condition, action" }, { status: 400 });
    }
    if (!["notify", "escalate", "block-release"].includes(action)) {
      return NextResponse.json({ error: "action must be notify, escalate, or block-release" }, { status: 400 });
    }
    const rule = await prisma.escalationRule.create({
      data: {
        projectId,
        condition: JSON.stringify(condition),
        action,
        targetUrl: targetUrl || "",
      },
    });
    return NextResponse.json(rule, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
