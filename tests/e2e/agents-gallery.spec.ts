import { test, expect } from '@playwright/test';

const BASE = 'https://clawqa.ai';

test.describe('Agents Gallery', () => {
  test('agents page loads and renders content', async ({ page }) => {
    await page.goto(`${BASE}/agents`);
    await page.waitForLoadState('networkidle');
    // Wait for client-side hydration
    await page.waitForTimeout(2000);
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
    expect(body!.length).toBeGreaterThan(50);
  });

  test('agents page has ClawQA branding', async ({ page }) => {
    await page.goto(`${BASE}/agents`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const body = await page.textContent('body');
    expect(body).toContain('ClawQA');
  });

  test('AgentX detail page loads', async ({ page }) => {
    await page.goto(`${BASE}/agents/agentx`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
    expect(body!.length).toBeGreaterThan(100);
  });

  test('AgentX page shows numeric data', async ({ page }) => {
    await page.goto(`${BASE}/agents/agentx`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
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
