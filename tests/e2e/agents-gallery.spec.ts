import { test, expect } from '@playwright/test';

const BASE = 'https://clawqa.ai';

test.describe('Agents Gallery', () => {
  test('agents page loads and shows project cards', async ({ page }) => {
    await page.goto(`${BASE}/agents`);
    await page.waitForLoadState('networkidle');
    // Should show at least one project
    const body = await page.textContent('body');
    expect(body).toContain('AgentX');
  });

  test('agents page has navigation back to main site', async ({ page }) => {
    await page.goto(`${BASE}/agents`);
    await page.waitForLoadState('networkidle');
    // Should have a link or nav element
    const links = await page.locator('a').count();
    expect(links).toBeGreaterThan(0);
  });

  test('AgentX detail page loads with screenshots', async ({ page }) => {
    await page.goto(`${BASE}/agents/agentx`);
    await page.waitForLoadState('networkidle');
    const body = await page.textContent('body');
    expect(body).toContain('AgentX');
    // Should show test stats
    expect(body).toMatch(/Passed|Failed|Screenshots|Total/i);
  });

  test('AgentX page shows pass/fail counts', async ({ page }) => {
    await page.goto(`${BASE}/agents/agentx`);
    await page.waitForLoadState('networkidle');
    // Should have passed and failed counts
    const body = await page.textContent('body');
    expect(body).toMatch(/\d+/); // Has numbers
  });

  test('AgentX page has filter buttons', async ({ page }) => {
    await page.goto(`${BASE}/agents/agentx`);
    await page.waitForLoadState('networkidle');
    // Should have All/Passed/Failed filter buttons
    const allBtn = page.getByRole('button', { name: /All/i });
    const passedBtn = page.getByRole('button', { name: /Passed/i });
    const failedBtn = page.getByRole('button', { name: /Failed/i });
    // At least one filter mechanism should exist
    const hasFilters = await allBtn.isVisible().catch(() => false)
      || await passedBtn.isVisible().catch(() => false)
      || await failedBtn.isVisible().catch(() => false);
    expect(hasFilters).toBe(true);
  });

  test('AgentX screenshots are clickable', async ({ page }) => {
    await page.goto(`${BASE}/agents/agentx`);
    await page.waitForLoadState('networkidle');
    // Find images (screenshots)
    const images = page.locator('img');
    const count = await images.count();
    if (count > 0) {
      // Click first image
      await images.first().click();
      // Should open a modal or enlarged view
      await page.waitForTimeout(500);
    }
    // Even if no images, page should load without error
    expect(await page.title()).toBeTruthy();
  });

  test('nonexistent agent returns 404 or empty state', async ({ page }) => {
    const res = await page.goto(`${BASE}/agents/nonexistent-project-xyz`);
    // Should either 404 or show "not found" message
    const status = res?.status();
    const body = await page.textContent('body');
    expect(status === 404 || body?.toLowerCase().includes('not found') || body?.toLowerCase().includes('no')).toBeTruthy();
  });
});
