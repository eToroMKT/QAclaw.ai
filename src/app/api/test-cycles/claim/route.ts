import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { cycleId } = await req.json();

  const activeCount = await prisma.testExecution.count({
    where: { testerId: session.user.id, status: { in: ["claimed", "in_progress"] } },
  });
  if (activeCount >= 3) {
    return NextResponse.json({ error: "Max 3 active tests. Complete or release existing tests first." }, { status: 429 });
  }

  const execution = await prisma.testExecution.create({
    data: { cycleId, testerId: session.user.id, status: "claimed" },
  });

  await prisma.testCycle.update({
    where: { id: cycleId },
    data: { status: "in_progress" },
  });

  return NextResponse.json(execution, { status: 201 });
}
