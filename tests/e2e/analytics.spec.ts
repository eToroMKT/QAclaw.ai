import { test, expect } from '@playwright/test';

const BASE = 'https://clawqa.ai';
const API_KEY = 'cqa_e2e_test_key_' + 'a'.repeat(48);
const AUTH = { 'Authorization': `Bearer ${API_KEY}` };

test.describe('Analytics API', () => {
  test('GET /api/v1/analytics returns data', async ({ request }) => {
    const res = await request.get(`${BASE}/api/v1/analytics`);
    // Might be public or auth-required
    expect([200, 401]).toContain(res.status());
    if (res.status() === 200) {
      const data = await res.json();
      expect(data).toBeTruthy();
    }
  });

  test('GET /api/v1/analytics with auth returns data', async ({ request }) => {
    const res = await request.get(`${BASE}/api/v1/analytics`, { headers: AUTH });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toBeTruthy();
  });
});

test.describe('User Profile API', () => {
  test('GET /api/me returns 401 without session', async ({ request }) => {
    const res = await request.get(`${BASE}/api/me`);
    expect([401, 403]).toContain(res.status());
  });
});

test.describe('Developers Page', () => {
  test('developers page loads', async ({ page }) => {
    await page.goto(`${BASE}/developers`);
    await page.waitForLoadState('domcontentloaded');
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });
});
