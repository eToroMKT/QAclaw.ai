import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import crypto from "crypto";

function hashKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.role !== "agent-owner" && user?.role !== "admin") {
    return NextResponse.json({ error: "Only agent-owners can manage API keys" }, { status: 403 });
  }

  const keys = await prisma.apiKey.findMany({
    where: { userId: session.user.id, revokedAt: null },
    select: { id: true, keyPrefix: true, name: true, createdAt: true, lastUsedAt: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(keys);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.role !== "agent-owner" && user?.role !== "admin") {
    return NextResponse.json({ error: "Only agent-owners can create API keys" }, { status: 403 });
  }

  const { name } = await req.json();
  const rawKey = `cqa_${crypto.randomBytes(32).toString("hex")}`;
  const keyPrefix = rawKey.substring(0, 12) + "...";

  await prisma.apiKey.create({
    data: {
      userId: session.user.id,
      keyHash: hashKey(rawKey),
      keyPrefix,
      name: name || "Unnamed Key",
    },
  });

  return NextResponse.json({ key: rawKey, prefix: keyPrefix, name: name || "Unnamed Key" });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const keyId = searchParams.get("id");
  if (!keyId) return NextResponse.json({ error: "Missing key id" }, { status: 400 });

  await prisma.apiKey.update({
    where: { id: keyId, userId: session.user.id },
    data: { revokedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
