import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { cycleId, title, severity, stepsToReproduce, expectedResult, actualResult } = await req.json();

  const bug = await prisma.bugReport.create({
    data: {
      cycleId, reporterId: session.user.id, title,
      severity: severity || "minor", stepsToReproduce: stepsToReproduce || "",
      expectedResult: expectedResult || "", actualResult: actualResult || "",
    },
  });

  return NextResponse.json(bug, { status: 201 });
}
