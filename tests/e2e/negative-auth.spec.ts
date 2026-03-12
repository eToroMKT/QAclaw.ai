import { test, expect } from '@playwright/test';

const BASE = 'https://clawqa.ai';

test.describe('Negative Auth — Invalid API Keys', () => {
  const INVALID_KEY = { 'Authorization': 'Bearer cqa_invalid_key_does_not_exist' };
  const MALFORMED_AUTH = { 'Authorization': 'NotBearer some-value' };
  const EMPTY_BEARER = { 'Authorization': 'Bearer ' };

  test('invalid API key returns 401 on protected endpoint', async ({ request }) => {
    const res = await request.get(`${BASE}/api/v1/webhooks`, { headers: INVALID_KEY });
    expect(res.status()).toBe(401);
    const data = await res.json();
    expect(data.error).toBeTruthy();
  });

  test('malformed auth header returns 401', async ({ request }) => {
    const res = await request.get(`${BASE}/api/v1/webhooks`, { headers: MALFORMED_AUTH });
    expect(res.status()).toBe(401);
  });

  test('empty bearer token returns 401', async ({ request }) => {
    const res = await request.get(`${BASE}/api/v1/webhooks`, { headers: EMPTY_BEARER });
    expect(res.status()).toBe(401);
  });

  test('no auth header returns 401 on all protected V1 endpoints', async ({ request }) => {
    const protectedEndpoints = [
      { method: 'GET', path: '/api/v1/webhooks' },
      { method: 'POST', path: '/api/v1/webhooks' },
      { method: 'POST', path: '/api/v1/test-plans' },
      { method: 'PUT', path: '/api/v1/test-plans' },
      { method: 'POST', path: '/api/v1/bugs' },
      { method: 'POST', path: '/api/v1/webhooks/test' },
    ];

    for (const ep of protectedEndpoints) {
      const res = ep.method === 'GET'
        ? await request.get(`${BASE}${ep.path}`)
        : await request.post(`${BASE}${ep.path}`, { data: {} });
      expect(res.status(), `${ep.method} ${ep.path} should be 401`).toBe(401);
    }
  });
});

test.describe('Negative Auth — Session Endpoints Without Login', () => {
  test('session-protected endpoints return 401 without cookies', async ({ request }) => {
    const sessionEndpoints = [
      { method: 'GET', path: '/api/my-tests' },
      { method: 'GET', path: '/api/bugs/session/mine' },
      { method: 'GET', path: '/api/api-keys' },
      { method: 'GET', path: '/api/me' },
      { method: 'POST', path: '/api/test-cycles/claim' },
      { method: 'POST', path: '/api/bugs/session' },
      { method: 'POST', path: '/api/api-keys' },
    ];

    for (const ep of sessionEndpoints) {
      const res = ep.method === 'GET'
        ? await request.get(`${BASE}${ep.path}`)
        : await request.post(`${BASE}${ep.path}`, { data: {} });
      expect([401, 403]).toContain(res.status());
    }
  });
});

test.describe('Negative Auth — Revoked API Key', () => {
  test.describe.configure({ mode: 'serial' });

  const VALID_KEY = 'cqa_e2e_test_key_' + 'a'.repeat(48);
  const AUTH = { 'Authorization': `Bearer ${VALID_KEY}` };
  let tempKeyRaw: string;
  let tempKeyId: string;

  test('create a temporary API key via session', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Login
    await page.goto(`${BASE}/login`);
    await page.getByPlaceholder('you@example.com').fill('e2e-shared-test@clawqa-test.com');
    await page.getByPlaceholder('Enter password').fill('SharedTestPass123!');
    const submitBtn = page.locator('form').first().locator('button[type="submit"]');
    await page.waitForFunction(() => {
      const btn = document.querySelector('form button[type="submit"]') as HTMLButtonElement;
      return btn && !btn.disabled;
    }, { timeout: 5000 });
    await submitBtn.click();
    await page.waitForURL('**/dashboard**', { timeout: 15000 });

    // Create key
    const res = await context.request.post(`${BASE}/api/api-keys`, {
      data: { name: 'Temp Revoke Test Key' },
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    tempKeyRaw = data.key;
    expect(tempKeyRaw).toMatch(/^cqa_/);

    // Find key ID
    const listRes = await context.request.get(`${BASE}/api/api-keys`);
    const keys = await listRes.json();
    const found = keys.find((k: any) => k.name === 'Temp Revoke Test Key');
    tempKeyId = found.id;

    await context.close();
  });

  test('temp key works before revocation', async ({ request }) => {
    if (!tempKeyRaw) test.skip();
    const res = await request.get(`${BASE}/api/v1/webhooks`, {
      headers: { 'Authorization': `Bearer ${tempKeyRaw}` },
    });
    expect(res.status()).toBe(200);
  });

  test('revoke the temp key', async ({ browser }) => {
    if (!tempKeyId) test.skip();
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${BASE}/login`);
    await page.getByPlaceholder('you@example.com').fill('e2e-shared-test@clawqa-test.com');
    await page.getByPlaceholder('Enter password').fill('SharedTestPass123!');
    const submitBtn = page.locator('form').first().locator('button[type="submit"]');
    await page.waitForFunction(() => {
      const btn = document.querySelector('form button[type="submit"]') as HTMLButtonElement;
      return btn && !btn.disabled;
    }, { timeout: 5000 });
    await submitBtn.click();
    await page.waitForURL('**/dashboard**', { timeout: 15000 });

    const res = await context.request.delete(`${BASE}/api/api-keys?id=${tempKeyId}`);
    expect(res.status()).toBe(200);
    await context.close();
  });

  test('revoked key returns 401', async ({ request }) => {
    if (!tempKeyRaw) test.skip();
    const res = await request.get(`${BASE}/api/v1/webhooks`, {
      headers: { 'Authorization': `Bearer ${tempKeyRaw}` },
    });
    expect(res.status()).toBe(401);
  });
});

test.describe('Negative Auth — UI Auth Guards', () => {
  test('all dashboard pages redirect to login without session', async ({ page }) => {
    const protectedPages = [
      '/dashboard',
      '/dashboard/test-cycles',
      '/dashboard/bugs',
      '/dashboard/my-tests',
      '/dashboard/my-bugs',
      '/dashboard/analytics',
      '/dashboard/browse-tests',
      '/dashboard/webhooks',
      '/dashboard/test-plans',
      '/settings',
      '/api-keys',
    ];

    for (const path of protectedPages) {
      await page.goto(`${BASE}${path}`);
      await page.waitForURL('**/login**', { timeout: 10000 });
      expect(page.url(), `${path} should redirect to login`).toContain('/login');
    }
  });
});
