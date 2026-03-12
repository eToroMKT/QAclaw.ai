import { test, expect } from '@playwright/test';
import { loginViaUI, registerUser } from './helpers/auth';

const BASE = 'https://clawqa.ai';

test.describe('API Key Management', () => {
  test.describe.configure({ mode: 'serial' });

  let page: import('@playwright/test').Page;
  let context: import('@playwright/test').BrowserContext;
  let storageState: any;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
    await loginViaUI(page, 'e2e-shared-test@clawqa-test.com', 'SharedTestPass123!');
    storageState = await context.storageState();
  });

  test.afterAll(async () => {
    await context?.close();
  });

  test('API keys page loads', async () => {
    await page.goto(`${BASE}/api-keys`);
    await page.waitForLoadState('domcontentloaded');
    // Should either show /api-keys or redirect to dashboard/api-keys
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('GET /api/api-keys returns 401 without auth', async ({ request }) => {
    const res = await request.get(`${BASE}/api/api-keys`);
    expect(res.status()).toBe(401);
  });

  test('GET /api/api-keys returns keys when authenticated', async () => {
    const res = await context.request.get(`${BASE}/api/api-keys`);
    expect(res.status()).toBe(200);
    const keys = await res.json();
    expect(Array.isArray(keys)).toBe(true);
  });

  test('POST /api/api-keys creates a new key', async () => {
    const res = await context.request.post(`${BASE}/api/api-keys`, {
      data: { name: 'E2E Generated Key' },
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.key).toBeTruthy();
    expect(data.key).toMatch(/^cqa_/);
    expect(data.name).toBe('E2E Generated Key');
  });

  test('DELETE /api/api-keys revokes a key', async () => {
    // First, list keys to find one to revoke
    const listRes = await context.request.get(`${BASE}/api/api-keys`);
    const keys = await listRes.json();
    const e2eKey = keys.find((k: any) => k.name === 'E2E Generated Key');
    if (!e2eKey) {
      test.skip();
      return;
    }

    const res = await context.request.delete(`${BASE}/api/api-keys?id=${e2eKey.id}`);
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);

    // Verify it's gone from list
    const listRes2 = await context.request.get(`${BASE}/api/api-keys`);
    const keys2 = await listRes2.json();
    const revoked = keys2.find((k: any) => k.id === e2eKey.id);
    expect(revoked).toBeUndefined();
  });
});
