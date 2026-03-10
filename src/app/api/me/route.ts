import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { testerProfile: true },
  });
  return NextResponse.json(user);
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { role, name, devices, languages, country, bio } = body;

  const updateData: any = {};
  if (role && ["tester", "agent-owner"].includes(role)) updateData.role = role;
  if (name) updateData.name = name;

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: updateData,
  });

  if (role === "tester" && (devices || languages || country || bio)) {
    await prisma.testerProfile.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        devices: JSON.stringify(devices || []),
        languages: JSON.stringify(languages || []),
        country: country || "",
        bio: bio || "",
      },
      update: {
        ...(devices && { devices: JSON.stringify(devices) }),
        ...(languages && { languages: JSON.stringify(languages) }),
        ...(country !== undefined && { country }),
        ...(bio !== undefined && { bio }),
      },
    });
  }

  return NextResponse.json(user);
}
