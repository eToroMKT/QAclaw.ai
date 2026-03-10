import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { randomBytes } from "crypto";

export async function GET(req: NextRequest) {
  const { user, response } = await requireAuth(req);
  if (response) return response;

  const webhooks = await prisma.webhook.findMany({
    where: { userId: user!.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(webhooks);
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireAuth(req);
  if (response) return response;

  try {
    const body = await req.json();
    const { url, events } = body;

    if (!url || !events?.length) {
      return NextResponse.json(
        { error: "Missing required fields: url, events" },
        { status: 400 }
      );
    }

    const webhook = await prisma.webhook.create({
      data: {
        userId: user!.id,
        url,
        events: JSON.stringify(events),
        secret: randomBytes(32).toString("hex"),
      },
    });

    return NextResponse.json(webhook, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
