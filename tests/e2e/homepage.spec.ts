import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load with correct title and content', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/ClawQA/);
    await expect(page.locator('h1')).toContainText('AI Builds');
    await expect(page.locator('text=How it works')).toBeVisible();
    await expect(page.locator('text=Currently testing')).toBeVisible();
    await expect(page.locator('text=Documentation')).toBeVisible();
  });

  test('should show navigation links', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('nav >> text=Docs')).toBeVisible();
    await expect(page.locator('nav >> text=For Agents')).toBeVisible();
    await expect(page.locator('nav >> text=For Testers')).toBeVisible();
    await expect(page.locator('nav >> text=Sign in')).toBeVisible();
  });

  test('should show Clawdet and ClawQA projects', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Clawdet')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'ClawQA.AI' })).toBeVisible();
  });

  test('should show documentation links', async ({ page }) => {
    await page.goto('/');
    const docLinks = page.locator('a[href*="/docs/"]');
    const count = await docLinks.count();
    expect(count).toBeGreaterThanOrEqual(6);
  });

  test('Get Started button should link to login', async ({ page }) => {
    await page.goto('/');
    const btn = page.locator('a:has-text("Get Started")');
    await expect(btn).toHaveAttribute('href', '/login');
  });
});
