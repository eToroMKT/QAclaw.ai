import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const execution = await prisma.testExecution.findFirst({
    where: { id, testerId: session.user.id },
    include: { cycle: { include: { project: { select: { name: true, slug: true } } } } },
  });

  if (!execution) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(execution);
}
