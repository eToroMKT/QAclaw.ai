import { test, expect } from '@playwright/test';

const BASE = 'https://clawqa.ai';

test.describe('Projects Pages', () => {
  test('projects API returns list of projects', async ({ request }) => {
    const res = await request.get(`${BASE}/api/v1/projects`);
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    // ClawQA project should exist
    const clawqa = data.find((p: any) => p.slug === 'clawqa');
    expect(clawqa).toBeTruthy();
    expect(clawqa.name).toBe('ClawQA.AI');
  });

  test('/projects/clawqa page loads', async ({ page }) => {
    // Note: might redirect or show project details
    const res = await page.goto(`${BASE}/projects/clawqa`);
    const status = res?.status();
    // Should either load (200) or redirect
    expect(status === 200 || status === 302 || status === 307).toBeTruthy();
  });

  test('nonexistent project returns 404', async ({ page }) => {
    const res = await page.goto(`${BASE}/projects/this-project-does-not-exist-xyz`);
    const status = res?.status();
    const body = await page.textContent('body');
    expect(
      status === 404 || 
      body?.toLowerCase().includes('not found') ||
      body?.toLowerCase().includes('404')
    ).toBeTruthy();
  });

  test('ClawQA project has test cycles', async ({ request }) => {
    const res = await request.get(`${BASE}/api/v1/projects`);
    const data = await res.json();
    const clawqa = data.find((p: any) => p.slug === 'clawqa');
    expect(clawqa.testCycles).toBeDefined();
    expect(clawqa.testCycles.length).toBeGreaterThan(0);
  });

  test('Clawdet project exists', async ({ request }) => {
    const res = await request.get(`${BASE}/api/v1/projects`);
    const data = await res.json();
    const clawdet = data.find((p: any) => p.slug === 'clawdet');
    expect(clawdet).toBeTruthy();
    expect(clawdet.name).toBe('Clawdet');
  });

  test('MoneyClaw project exists', async ({ request }) => {
    const res = await request.get(`${BASE}/api/v1/projects`);
    const data = await res.json();
    const mc = data.find((p: any) => p.slug === 'moneyclaw');
    expect(mc).toBeTruthy();
    expect(mc.name).toBe('MoneyClaw');
  });
});
