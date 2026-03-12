import { test, expect } from '@playwright/test';

const BASE = 'https://clawqa.ai';

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

// Serial tests: login once, then navigate through dashboard pages using the same context
test.describe('Dashboard - Authenticated Pages', () => {
  test.describe.configure({ mode: 'serial' });

  let sharedPage: import('@playwright/test').Page;
  let sharedContext: import('@playwright/test').BrowserContext;

  test.beforeAll(async ({ browser }) => {
    sharedContext = await browser.newContext();
    sharedPage = await sharedContext.newPage();

    // Ensure shared user exists (ignore 409/429)
    await sharedContext.request.post(`${BASE}/api/auth/register`, {
      data: { email: 'e2e-shared-test@clawqa-test.com', password: 'SharedTestPass123!', name: 'E2E Shared User' },
    });

    // Login via UI
    await sharedPage.goto(`${BASE}/login`);
    await sharedPage.getByPlaceholder('you@example.com').fill('e2e-shared-test@clawqa-test.com');
    await sharedPage.getByPlaceholder('Enter password').fill('SharedTestPass123!');
    await sharedPage.waitForFunction(() => {
      const btn = document.querySelector('form button[type="submit"]') as HTMLButtonElement;
      return btn && !btn.disabled;
    }, { timeout: 5000 });
    await sharedPage.locator('form').first().locator('button[type="submit"]').click();
    await sharedPage.waitForURL('**/dashboard**', { timeout: 15000 });
  });

  test.afterAll(async () => {
    await sharedContext?.close();
  });

  test('dashboard main page loads', async () => {
    await sharedPage.goto(`${BASE}/dashboard`);
    // Don't use networkidle — dashboard may have persistent connections
    await sharedPage.waitForLoadState('domcontentloaded');
    expect(sharedPage.url()).toContain('/dashboard');
    await expect(sharedPage.locator('nav')).toBeVisible();
  });

  test('test cycles page loads', async () => {
    await sharedPage.goto(`${BASE}/dashboard/test-cycles`);
    await sharedPage.waitForLoadState('domcontentloaded');
    expect(sharedPage.url()).toContain('/test-cycles');
  });

  test('bugs page loads', async () => {
    await sharedPage.goto(`${BASE}/dashboard/bugs`);
    await sharedPage.waitForLoadState('domcontentloaded');
    expect(sharedPage.url()).toContain('/bugs');
  });

  test('my tests page loads', async () => {
    await sharedPage.goto(`${BASE}/dashboard/my-tests`);
    await sharedPage.waitForLoadState('domcontentloaded');
    expect(sharedPage.url()).toContain('/my-tests');
  });

  test('analytics page loads', async () => {
    await sharedPage.goto(`${BASE}/dashboard/analytics`);
    await sharedPage.waitForLoadState('domcontentloaded');
    expect(sharedPage.url()).toContain('/analytics');
  });

  test('browse tests page loads', async () => {
    await sharedPage.goto(`${BASE}/dashboard/browse-tests`);
    await sharedPage.waitForLoadState('domcontentloaded');
    expect(sharedPage.url()).toContain('/browse-tests');
  });

  test('webhooks page loads', async () => {
    await sharedPage.goto(`${BASE}/dashboard/webhooks`);
    await sharedPage.waitForLoadState('domcontentloaded');
    expect(sharedPage.url()).toContain('/webhooks');
  });

  test('test plans page loads', async () => {
    await sharedPage.goto(`${BASE}/dashboard/test-plans`);
    await sharedPage.waitForLoadState('domcontentloaded');
    expect(sharedPage.url()).toContain('/test-plans');
  });
});
