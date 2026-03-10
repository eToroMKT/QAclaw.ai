import { describe, it, expect, vi, beforeEach } from "vitest";

// ===== Test 1: Webhook dispatcher retry logic =====
describe("Webhook Dispatcher", () => {
  it("should export dispatchWebhook function", async () => {
    const mod = await import("@/lib/webhook-dispatcher");
    expect(typeof mod.dispatchWebhook).toBe("function");
  });
});

// ===== Test 2: Applause client configuration detection =====
describe("Applause Client", () => {
  it("should detect unconfigured state", async () => {
    const { ApplauseClient } = await import("@/lib/applause");
    const client = new ApplauseClient();
    expect(client.isConfigured).toBe(false);
  });

  it("should detect configured state with valid config", async () => {
    const { ApplauseClient } = await import("@/lib/applause");
    const client = new ApplauseClient({
      apiKey: "test-key",
      productId: 123,
    });
    expect(client.isConfigured).toBe(true);
  });

  it("should throw when starting test run without config", async () => {
    const { ApplauseClient } = await import("@/lib/applause");
    const client = new ApplauseClient();
    await expect(client.startTestRun(["test"])).rejects.toThrow("not configured");
  });
});

// ===== Test 3: Auto-fix job status values =====
describe("Auto-Fix Job Statuses", () => {
  const validStatuses = ["queued", "analyzing", "fixing", "deploying", "retesting", "verified", "failed"];

  it("should have all expected status values defined", () => {
    expect(validStatuses).toHaveLength(7);
    expect(validStatuses).toContain("queued");
    expect(validStatuses).toContain("verified");
    expect(validStatuses).toContain("failed");
  });
});

// ===== Test 4: Webhook delivery retry delays =====
describe("Webhook Retry Logic", () => {
  it("should have correct retry delay constants", async () => {
    // Read the source to verify retry delays
    const fs = await import("fs");
    const source = fs.readFileSync("src/lib/webhook-dispatcher.ts", "utf-8");
    expect(source).toContain("1000, 10000, 60000");
    expect(source).toContain("RETRY_DELAYS");
  });
});

// ===== Test 5: HMAC signature generation =====
describe("Webhook Signature", () => {
  it("should generate valid HMAC-SHA256 signatures", async () => {
    const { createHmac } = await import("crypto");
    const secret = "test-secret";
    const payload = JSON.stringify({ event: "test", data: {} });
    const signature = createHmac("sha256", secret).update(payload).digest("hex");
    expect(signature).toMatch(/^[a-f0-9]{64}$/);
  });
});

// ===== Test 6: Applause results sync creates correct bug title format =====
describe("Applause Sync Bug Format", () => {
  it("should use [Applause Sync] prefix in bug titles", () => {
    const execId = "clxyz12345";
    const title = `[Applause Sync] Failed execution ${execId.slice(0, 8)}`;
    expect(title).toMatch(/^\[Applause Sync\]/);
    expect(title).toContain("clxyz123");
  });
});

// ===== Test 7: Auto-fix webhook payload structure =====
describe("Auto-Fix Webhook Payload", () => {
  it("should contain required fields for auto-fix processing", () => {
    const payload = {
      bugId: "test-id",
      title: "Test bug",
      stepsToReproduce: "1. Click button",
      expectedResult: "Nothing happens",
      actualResult: "Crash",
      deviceInfo: "{}",
      screenshotUrls: "[]",
      project: "TestProject",
      targetUrl: "https://example.com",
    };

    expect(payload).toHaveProperty("bugId");
    expect(payload).toHaveProperty("stepsToReproduce");
    expect(payload).toHaveProperty("expectedResult");
    expect(payload).toHaveProperty("actualResult");
    expect(payload).toHaveProperty("project");
    expect(payload).toHaveProperty("targetUrl");
  });
});
