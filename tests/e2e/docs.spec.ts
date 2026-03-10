import { test, expect } from '@playwright/test';

const docPages = [
  { path: '/docs/', titleContains: 'ClawQA' },
  { path: '/docs/overview.html', titleContains: 'Overview' },
  { path: '/docs/architecture.html', titleContains: 'Architecture' },
  { path: '/docs/phases.html', titleContains: 'Roadmap' },
  { path: '/docs/for-project-managers.html', titleContains: 'Project' },
  { path: '/docs/for-agents.html', titleContains: 'Agents' },
];

test.describe('Documentation Pages', () => {
  for (const doc of docPages) {
    test(`${doc.path} should load and have content`, async ({ page }) => {
      const resp = await page.goto(doc.path);
      expect(resp?.status()).toBe(200);
      const bodyText = await page.locator('body').textContent();
      expect(bodyText!.length).toBeGreaterThan(200);
    });
  }

  test('docs hub should link to all doc pages', async ({ page }) => {
    await page.goto('/docs/');
    for (const doc of docPages.slice(1)) {
      const filename = doc.path.split('/').pop();
      const link = page.locator(`a[href*="${filename}"]`);
      const count = await link.count();
      expect(count).toBeGreaterThanOrEqual(1);
    }
  });
});
