import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { prisma } from "./prisma";
import { checkRateLimit } from "./rate-limit";

export async function authenticateApiKey(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const key = authHeader.slice(7);
  const keyHash = createHash("sha256").update(key).digest("hex");

  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash },
    include: { user: true },
  });

  if (!apiKey || apiKey.revokedAt) return null;

  prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  }).catch(() => {});

  return apiKey.user;
}

export async function requireAuth(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const key = authHeader.slice(7);
    const rl = checkRateLimit(key);
    if (!rl.allowed) {
      return {
        user: null,
        response: NextResponse.json(
          { error: "Too Many Requests", message: "Rate limit exceeded. 100 requests per minute." },
          { status: 429, headers: { "Retry-After": String(rl.retryAfter || 60) } }
        ),
      };
    }
  }

  const user = await authenticateApiKey(req);
  if (!user) {
    return {
      user: null,
      response: NextResponse.json(
        { error: "Unauthorized", message: "Valid API key required. Pass Authorization: Bearer <key>" },
        { status: 401 }
      ),
    };
  }
  return { user, response: null };
}
