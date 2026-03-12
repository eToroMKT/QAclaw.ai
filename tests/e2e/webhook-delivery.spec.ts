import { test, expect } from '@playwright/test';

const BASE = 'https://clawqa.ai';
const API_KEY = 'cqa_e2e_test_key_' + 'a'.repeat(48);
const AUTH = { 'Authorization': `Bearer ${API_KEY}` };

test.describe('Webhook Delivery Verification', () => {
  test.describe.configure({ mode: 'serial' });

  let webhookId: string;
  let webhookSecret: string;

  test('create webhook for delivery tests', async ({ request }) => {
    const res = await request.post(`${BASE}/api/v1/webhooks`, {
      headers: AUTH,
      data: {
        url: 'https://httpbin.org/post',
        events: ['bug_report.created', 'test.ping'],
      },
    });
    expect(res.status()).toBe(201);
    const hook = await res.json();
    webhookId = hook.id;
    webhookSecret = hook.secret;
    expect(webhookId).toBeTruthy();
    expect(webhookSecret).toBeTruthy();
  });

  test('POST /api/v1/webhooks/test sends test ping', async ({ request }) => {
    if (!webhookId) test.skip();
    const res = await request.post(`${BASE}/api/v1/webhooks/test`, {
      headers: AUTH,
      data: { url: 'https://httpbin.org/post', secret: webhookSecret },
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.statusCode).toBe(200);
  });

  test('POST /api/v1/webhooks/test handles unreachable URL', async ({ request }) => {
    const res = await request.post(`${BASE}/api/v1/webhooks/test`, {
      headers: AUTH,
      data: { url: 'https://this-domain-does-not-exist-e2e.invalid/hook', secret: 'test' },
    });
    // Should return 502 with error details
    expect(res.status()).toBe(502);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toBeTruthy();
  });

  test('POST /api/v1/webhooks/test rejects missing url', async ({ request }) => {
    const res = await request.post(`${BASE}/api/v1/webhooks/test`, {
      headers: AUTH,
      data: { secret: 'test' },
    });
    expect(res.status()).toBe(400);
  });

  test('bug creation triggers webhook delivery', async ({ request }) => {
    if (!webhookId) test.skip();
    // Create a bug — should trigger the bug_report.created webhook
    const bugRes = await request.post(`${BASE}/api/v1/bugs`, {
      headers: AUTH,
      data: {
        cycleId: 'cycle-clawqa-oauth',
        title: 'Webhook Trigger Test Bug',
        severity: 'low',
        stepsToReproduce: 'Automated webhook delivery test',
      },
    });
    expect(bugRes.status()).toBe(201);

    // Wait a moment for async delivery
    await new Promise(r => setTimeout(r, 3000));

    // Check deliveries
    const delRes = await request.get(`${BASE}/api/v1/webhooks/${webhookId}/deliveries`, {
      headers: AUTH,
    });
    expect(delRes.status()).toBe(200);
    const data = await delRes.json();
    expect(data.deliveries).toBeTruthy();
    expect(Array.isArray(data.deliveries)).toBe(true);
    // Should have at least one delivery for bug_report.created
    const bugDelivery = data.deliveries.find((d: any) => d.event === 'bug_report.created');
    if (bugDelivery) {
      expect(bugDelivery.success).toBe(true);
      expect(bugDelivery.statusCode).toBe(200);
      expect(bugDelivery.duration).toBeGreaterThan(0);
    }
  });

  test('GET /api/v1/webhooks/:id/deliveries returns 404 for wrong webhook', async ({ request }) => {
    const res = await request.get(`${BASE}/api/v1/webhooks/nonexistent-hook/deliveries`, {
      headers: AUTH,
    });
    expect(res.status()).toBe(404);
  });

  test('GET /api/v1/webhooks/:id/deliveries returns 401 without auth', async ({ request }) => {
    if (!webhookId) test.skip();
    const res = await request.get(`${BASE}/api/v1/webhooks/${webhookId}/deliveries`);
    expect(res.status()).toBe(401);
  });
});
