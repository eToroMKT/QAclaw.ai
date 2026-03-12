import { test, expect } from '@playwright/test';

const BASE = 'https://clawqa.ai';
const API_KEY = 'cqa_e2e_test_key_' + 'a'.repeat(48);
const AUTH = { 'Authorization': `Bearer ${API_KEY}` };

test.describe('Webhooks - API CRUD', () => {
  test.describe.configure({ mode: 'serial' });

  let createdWebhookId: string;

  test('GET /api/v1/webhooks returns 401 without auth', async ({ request }) => {
    const res = await request.get(`${BASE}/api/v1/webhooks`);
    expect(res.status()).toBe(401);
  });

  test('GET /api/v1/webhooks returns array with auth', async ({ request }) => {
    const res = await request.get(`${BASE}/api/v1/webhooks`, { headers: AUTH });
    expect(res.status()).toBe(200);
    const hooks = await res.json();
    expect(Array.isArray(hooks)).toBe(true);
  });

  test('POST /api/v1/webhooks creates a webhook', async ({ request }) => {
    const res = await request.post(`${BASE}/api/v1/webhooks`, {
      headers: AUTH,
      data: {
        url: 'https://httpbin.org/post',
        events: ['bug.created', 'test_cycle.completed'],
      },
    });
    expect(res.status()).toBe(201);
    const hook = await res.json();
    expect(hook.id).toBeTruthy();
    expect(hook.secret).toBeTruthy();
    createdWebhookId = hook.id;
  });

  test('POST /api/v1/webhooks rejects missing fields', async ({ request }) => {
    const res = await request.post(`${BASE}/api/v1/webhooks`, {
      headers: AUTH,
      data: { url: 'https://example.com' },
    });
    expect(res.status()).toBe(400);
  });

  test('POST /api/v1/webhooks/test returns 401 without auth', async ({ request }) => {
    const res = await request.post(`${BASE}/api/v1/webhooks/test`, {
      data: { webhookId: 'test' },
    });
    expect(res.status()).toBe(401);
  });

  test('GET /api/v1/webhooks includes created webhook', async ({ request }) => {
    if (!createdWebhookId) test.skip();
    const res = await request.get(`${BASE}/api/v1/webhooks`, { headers: AUTH });
    const hooks = await res.json();
    const found = hooks.find((h: any) => h.id === createdWebhookId);
    expect(found).toBeTruthy();
  });
});
