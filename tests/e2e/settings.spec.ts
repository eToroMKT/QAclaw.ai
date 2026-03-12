import { test, expect } from '@playwright/test';
import { loginViaUI, registerUser } from './helpers/auth';

const BASE = 'https://clawqa.ai';

test.describe('Settings Page', () => {
  let storageState: { cookies: any[]; origins: any[] };

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await context.request.post(`${BASE}/api/auth/register`, {
      data: { email: 'e2e-shared-test@clawqa-test.com', password: 'SharedTestPass123!', name: 'E2E Shared User' },
    });
    await loginViaUI(page, 'e2e-shared-test@clawqa-test.com', 'SharedTestPass123!');
    storageState = await context.storageState();
    await context.close();
  });

  test('settings redirects to login when not authenticated', async ({ page }) => {
    await page.goto(`${BASE}/settings`);
    await page.waitForURL('**/login**', { timeout: 10000 });
    expect(page.url()).toContain('/login');
  });

  test('settings page loads when authenticated', async ({ browser }) => {
    // Use a new context with the saved auth cookies
    const context = await browser.newContext({ storageState });
    const page = await context.newPage();
    await page.goto(`${BASE}/settings`);
    await page.waitForLoadState('domcontentloaded');
    expect(page.url()).toContain('/settings');
    await context.close();
  });
});
