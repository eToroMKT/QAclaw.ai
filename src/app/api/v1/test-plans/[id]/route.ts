import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const plan = await prisma.testPlan.findUnique({
    where: { id },
    include: {
      project: { select: { id: true, name: true, slug: true } },
      createdBy: { select: { id: true, name: true } },
      history: { orderBy: { version: "desc" } },
    },
  });
  if (!plan) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(plan);
}
