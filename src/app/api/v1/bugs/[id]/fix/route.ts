import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth(req);
  if (response) return response;

  try {
    const { id } = await params;
    const body = await req.json();
    const { commitUrl, deployUrl, notes } = body;

    const bug = await prisma.bugReport.findUnique({ where: { id } });
    if (!bug) {
      return NextResponse.json({ error: "Bug not found" }, { status: 404 });
    }

    const fix = await prisma.fixAttempt.create({
      data: {
        bugId: id,
        commitUrl: commitUrl || "",
        deployUrl: deployUrl || "",
        notes: notes || "",
      },
    });

    await prisma.bugReport.update({
      where: { id },
      data: { status: "re_testing" },
    });

    return NextResponse.json(fix, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
