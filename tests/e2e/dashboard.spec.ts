import { test, expect, type Page, type APIRequestContext } from '@playwright/test';

const BASE = 'https://clawqa.ai';

function testEmail() {
  return `test-dash-${Date.now()}@clawqa-test.com`;
}

async function loginAsTestUser(page: Page, request: APIRequestContext) {
  const email = testEmail();
  const password = 'DashTest123!';
  const res = await request.post(`${BASE}/api/auth/register`, {
    data: { email, password, name: 'Dashboard Test' },
  });
  if (res.status() === 429) {
    throw new Error('Rate limited — skip authenticated tests');
  }
  await page.goto(`${BASE}/login`);
  await page.getByPlaceholder('you@example.com').fill(email);
  await page.getByPlaceholder('Enter password').fill(password);
  await page.locator('form button[type="submit"]').click();
  await page.waitForURL('**/dashboard**', { timeout: 10000 });
  return email;
}

test.describe('Dashboard - Auth Guards', () => {
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
  ];

  for (const path of protectedPages) {
    test(`${path} redirects to login when not authenticated`, async ({ page }) => {
      await page.goto(`${BASE}${path}`);
      await page.waitForURL('**/login**', { timeout: 10000 });
      expect(page.url()).toContain('/login');
    });
  }
});

test.describe('Dashboard - Authenticated Pages', () => {
  let email: string;

  test.beforeEach(async ({ page, request }) => {
    email = await loginAsTestUser(page, request);
  });

  test.afterEach(async ({ request }) => {
    await request.delete(`${BASE}/api/v1/users`, { data: { email } }).catch(() => {});
  });

  test('dashboard main page loads', async ({ page }) => {
    await expect(page).toHaveURL(/dashboard/);
    // Should have navigation/sidebar
    const content = await page.textContent('body');
    expect(content).toBeTruthy();
  });

  test('test cycles page loads', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/test-cycles`);
    await expect(page).toHaveURL(/test-cycles/);
    await page.waitForLoadState('networkidle');
  });

  test('bugs page loads', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/bugs`);
    await expect(page).toHaveURL(/bugs/);
    await page.waitForLoadState('networkidle');
  });

  test('my tests page loads', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/my-tests`);
    await expect(page).toHaveURL(/my-tests/);
    await page.waitForLoadState('networkidle');
  });

  test('analytics page loads', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/analytics`);
    await expect(page).toHaveURL(/analytics/);
    await page.waitForLoadState('networkidle');
  });

  test('browse tests page loads', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/browse-tests`);
    await expect(page).toHaveURL(/browse-tests/);
    await page.waitForLoadState('networkidle');
  });

  test('webhooks page loads', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/webhooks`);
    await expect(page).toHaveURL(/webhooks/);
    await page.waitForLoadState('networkidle');
  });

  test('test plans page loads', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/test-plans`);
    await expect(page).toHaveURL(/test-plans/);
    await page.waitForLoadState('networkidle');
  });
});
