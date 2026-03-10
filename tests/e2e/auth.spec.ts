import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('login page should load', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('text=GitHub')).toBeVisible();
  });

  test('dashboard should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL('**/login');
    expect(page.url()).toContain('/login');
  });

  test('settings should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForURL('**/login');
    expect(page.url()).toContain('/login');
  });

  test('projects page should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/projects/clawdet');
    await page.waitForURL('**/login');
    expect(page.url()).toContain('/login');
  });

  test('CSRF endpoint should return token', async ({ request }) => {
    const resp = await request.get('/api/auth/csrf');
    const data = await resp.json();
    expect(data).toHaveProperty('csrfToken');
    expect(data.csrfToken.length).toBeGreaterThan(10);
  });

  test('GitHub OAuth redirect should work', async ({ request }) => {
    const csrfResp = await request.get('/api/auth/csrf');
    const { csrfToken } = await csrfResp.json();
    const resp = await request.post('/api/auth/signin/github', {
      form: { csrfToken },
      maxRedirects: 0,
    });
    expect([301, 302, 303]).toContain(resp.status());
    const location = resp.headers()['location'] || '';
    expect(location).toContain('github.com/login/oauth');
    expect(location).toContain('Ov23liixP9DYutd7XUfG');
  });
});
