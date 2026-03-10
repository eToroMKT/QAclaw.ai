import { createHmac } from "crypto";
import { prisma } from "./prisma";

const RETRY_DELAYS = [1000, 10000, 60000]; // 1s, 10s, 60s

async function deliverWebhook(webhook: any, event: string, payload: string, signature: string, retryCount = 0): Promise<void> {
  const startTime = Date.now();
  let statusCode: number | null = null;
  let responseBody = "";
  let success = false;

  try {
    const res = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-ClawQA-Signature": `sha256=${signature}`,
      },
      body: payload,
      signal: AbortSignal.timeout(10000),
    });
    statusCode = res.status;
    responseBody = (await res.text()).slice(0, 4000);
    success = res.ok;
  } catch (e: any) {
    responseBody = e.message || "Connection failed";
  }

  const duration = Date.now() - startTime;

  await prisma.webhookDelivery.create({
    data: {
      webhookId: webhook.id,
      event,
      payload,
      statusCode,
      responseBody,
      duration,
      success,
      retryCount,
    },
  });

  // Retry on failure
  if (!success && retryCount < RETRY_DELAYS.length) {
    setTimeout(() => {
      deliverWebhook(webhook, event, payload, signature, retryCount + 1);
    }, RETRY_DELAYS[retryCount]);
  }
}

export async function dispatchWebhook(event: string, data: any, userId: string) {
  try {
    const webhooks = await prisma.webhook.findMany({
      where: { userId, active: true },
    });

    for (const webhook of webhooks) {
      const events: string[] = JSON.parse(webhook.events);
      if (!events.includes(event)) continue;

      const payload = JSON.stringify({ event, data, timestamp: new Date().toISOString() });
      const signature = createHmac("sha256", webhook.secret).update(payload).digest("hex");

      // Fire-and-forget with retry
      deliverWebhook(webhook, event, payload, signature).catch(() => {});
    }
  } catch {
    // Don't let webhook errors affect the main flow
  }
}
