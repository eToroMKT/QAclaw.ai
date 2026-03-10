import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const executions = await prisma.testExecution.findMany({
    where: { testerId: session.user.id },
    include: { cycle: { include: { project: { select: { name: true, slug: true } } } } },
    orderBy: { startedAt: "desc" },
  });

  return NextResponse.json(executions);
}
