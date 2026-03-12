import { test, expect } from '@playwright/test';

// Docs are static HTML files served from public/docs/
// /docs/ path gets intercepted by Next.js, so use /docs/index.html explicitly
const docPages = [
  { path: '/docs/index.html', titleContains: 'ClawQA' },
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

  test('docs hub should link to other doc pages', async ({ page }) => {
    await page.goto('/docs/index.html');
    // Check only the pages that are actually linked from index.html
    const linkedPages = [
      'overview.html',
      'architecture.html',
      'for-project-managers.html',
      'for-agents.html',
      'phases.html',
    ];
    for (const filename of linkedPages) {
      const link = page.locator(`a[href*="${filename}"]`);
      const count = await link.count();
      expect(count).toBeGreaterThanOrEqual(1);
    }
  });
});
