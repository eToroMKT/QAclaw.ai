import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const projects = await prisma.project.findMany({
    include: { testCycles: { select: { id: true, title: true, priority: true, status: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(projects);
}
