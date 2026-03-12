import { test, expect } from '@playwright/test';
import { loginViaUI } from './helpers/auth';

const BASE = 'https://clawqa.ai';

test.describe('Full User Journey', () => {
  test.describe.configure({ mode: 'serial' });

  let page: import('@playwright/test').Page;
  let context: import('@playwright/test').BrowserContext;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
  });

  test.afterAll(async () => {
    await context?.close();
  });

  test('1. login with shared account', async () => {
    await loginViaUI(page, 'e2e-shared-test@clawqa-test.com', 'SharedTestPass123!');
    expect(page.url()).toContain('/dashboard');
  });

  test('2. dashboard renders with content', async () => {
    await page.waitForLoadState('domcontentloaded');
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
    const hasContent = body!.includes('Dashboard') || body!.includes('dashboard') || body!.includes('Test');
    expect(hasContent).toBe(true);
  });

  test('3. navigate to test cycles page', async () => {
    await page.goto(`${BASE}/dashboard/test-cycles`);
    await page.waitForLoadState('domcontentloaded');
    expect(page.url()).toContain('/test-cycles');
  });

  test('4. navigate to browse tests', async () => {
    await page.goto(`${BASE}/dashboard/browse-tests`);
    await page.waitForLoadState('domcontentloaded');
    expect(page.url()).toContain('/browse-tests');
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('5. check my tests page', async () => {
    await page.goto(`${BASE}/dashboard/my-tests`);
    await page.waitForLoadState('domcontentloaded');
    expect(page.url()).toContain('/my-tests');
  });

  test('6. check bugs page', async () => {
    await page.goto(`${BASE}/dashboard/bugs`);
    await page.waitForLoadState('domcontentloaded');
    expect(page.url()).toContain('/bugs');
  });

  test('7. visit settings page', async () => {
    await page.goto(`${BASE}/settings`);
    await page.waitForLoadState('domcontentloaded');
    expect(page.url()).toContain('/settings');
  });

  test('8. visit analytics page', async () => {
    await page.goto(`${BASE}/dashboard/analytics`);
    await page.waitForLoadState('domcontentloaded');
    expect(page.url()).toContain('/analytics');
  });

  test('9. visit webhooks page', async () => {
    await page.goto(`${BASE}/dashboard/webhooks`);
    await page.waitForLoadState('domcontentloaded');
    expect(page.url()).toContain('/webhooks');
  });

  test('10. visit test plans page', async () => {
    await page.goto(`${BASE}/dashboard/test-plans`);
    await page.waitForLoadState('domcontentloaded');
    expect(page.url()).toContain('/test-plans');
  });

  test('11. logout and verify redirect', async () => {
    await context.clearCookies();
    await page.goto(`${BASE}/dashboard`);
    await page.waitForURL('**/login**', { timeout: 10000 });
    expect(page.url()).toContain('/login');
  });
});
