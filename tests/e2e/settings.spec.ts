import { test, expect } from '@playwright/test';

const BASE = 'https://clawqa.ai';

test.describe('Settings Page', () => {
  test('settings redirects to login when not authenticated', async ({ page }) => {
    await page.goto(`${BASE}/settings`);
    await page.waitForURL('**/login**', { timeout: 10000 });
    expect(page.url()).toContain('/login');
  });

  test('settings page loads after registration + login', async ({ page, request }) => {
    const email = `test-settings-${Date.now()}@clawqa-test.com`;
    const password = 'SettingsTest123!';
    
    // Register
    await request.post(`${BASE}/api/auth/register`, {
      data: { email, password, name: 'Settings Tester' },
    });
    
    // Login via UI
    await page.goto(`${BASE}/login`);
    await page.getByPlaceholder('you@example.com').fill(email);
    await page.getByPlaceholder('Enter password').fill(password);
    await page.locator('form button[type="submit"]').click();
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    
    // Navigate to settings
    await page.goto(`${BASE}/settings`);
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/settings');
    
    // Cleanup
    await request.delete(`${BASE}/api/v1/users`, { data: { email } }).catch(() => {});
  });
});
