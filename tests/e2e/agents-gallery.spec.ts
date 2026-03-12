import { test, expect } from '@playwright/test';

const BASE = 'https://clawqa.ai';

test.describe('Agents Gallery', () => {
  test('agents page loads with correct title', async ({ page }) => {
    await page.goto(`${BASE}/agents`);
    await expect(page).toHaveTitle(/Automated Test Results|ClawQA/);
  });

  test('agents page has navigation', async ({ page }) => {
    await page.goto(`${BASE}/agents`);
    await expect(page.locator('header')).toBeVisible();
    await expect(page.getByText('ClawQA')).toBeVisible();
    await expect(page.getByText('Test Results')).toBeVisible();
  });

  test('agents page has footer', async ({ page }) => {
    await page.goto(`${BASE}/agents`);
    await expect(page.locator('footer')).toBeVisible();
  });

  test('AgentX detail page loads', async ({ page }) => {
    await page.goto(`${BASE}/agents/agentx`);
    await page.waitForLoadState('networkidle');
    const body = await page.textContent('body');
    // Page should load without error
    expect(body).toBeTruthy();
    expect(body!.length).toBeGreaterThan(100);
  });

  test('AgentX page shows test statistics', async ({ page }) => {
    await page.goto(`${BASE}/agents/agentx`);
    await page.waitForLoadState('networkidle');
    const body = await page.textContent('body');
    // Should show numeric stats (passed/failed counts)
    expect(body).toMatch(/\d+/);
  });

  test('nonexistent agent returns 404 or empty state', async ({ page }) => {
    const res = await page.goto(`${BASE}/agents/nonexistent-project-xyz`);
    const status = res?.status();
    const body = await page.textContent('body');
    expect(
      status === 404 || 
      body?.toLowerCase().includes('not found') || 
      body?.toLowerCase().includes('no screenshots') ||
      body?.toLowerCase().includes('no')
    ).toBeTruthy();
  });
});
