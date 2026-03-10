import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth(req);
  if (response) return response;

  const { id } = await params;
  const webhook = await prisma.webhook.findUnique({ where: { id } });
  if (!webhook || webhook.userId !== user!.id) {
    return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
  }

  const deliveries = await prisma.webhookDelivery.findMany({
    where: { webhookId: id },
    orderBy: { deliveredAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ deliveries });
}
