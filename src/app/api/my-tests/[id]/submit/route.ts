import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { results } = await req.json();

  await prisma.testExecution.update({
    where: { id, testerId: session.user.id },
    data: { status: "submitted", completedAt: new Date(), resultsJson: JSON.stringify(results) },
  });

  return NextResponse.json({ success: true });
}
