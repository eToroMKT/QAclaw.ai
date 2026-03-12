import { test, expect, type APIRequestContext } from '@playwright/test';

const BASE = 'https://clawqa.ai';

function testEmail() {
  return `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@clawqa-test.com`;
}

async function registerUser(request: APIRequestContext, email: string, password = 'TestPass123!', name = 'E2E Test User') {
  return request.post(`${BASE}/api/auth/register`, {
    data: { email, password, name },
  });
}

async function deleteTestUser(request: APIRequestContext, email: string) {
  // Clean up via internal API (best-effort)
  await request.delete(`${BASE}/api/v1/users`, {
    data: { email },
  }).catch(() => {});
}

test.describe('Email Registration & Login', () => {
  test.describe('Registration Page UI', () => {
    test('login page loads with Sign In and Register tabs', async ({ page }) => {
      await page.goto(`${BASE}/login`);
      await expect(page.getByText('Sign In')).toBeVisible();
      await expect(page.getByText('Register')).toBeVisible();
      await expect(page.getByText('Continue with GitHub')).toBeVisible();
    });

    test('Register tab shows name, email, password, confirm fields', async ({ page }) => {
      await page.goto(`${BASE}/login`);
      await page.getByText('Register').click();
      await expect(page.getByPlaceholder('Your name')).toBeVisible();
      await expect(page.getByPlaceholder('you@example.com')).toBeVisible();
      await expect(page.getByPlaceholder('Min 8 characters')).toBeVisible();
      await expect(page.getByPlaceholder('Repeat password')).toBeVisible();
      await expect(page.getByText('Create Account')).toBeVisible();
    });

    test('Sign In tab shows email and password fields', async ({ page }) => {
      await page.goto(`${BASE}/login`);
      // Sign In is default tab
      await expect(page.getByPlaceholder('you@example.com')).toBeVisible();
      await expect(page.getByPlaceholder('Enter password')).toBeVisible();
      await expect(page.getByRole('button', { name: /Sign In/i })).toBeVisible();
    });

    test('Demo password section exists', async ({ page }) => {
      await page.goto(`${BASE}/login`);
      await expect(page.getByPlaceholder('Demo password')).toBeVisible();
    });
  });

  test.describe('Registration API', () => {
    test('register with valid data succeeds', async ({ request }) => {
      const email = testEmail();
      const res = await registerUser(request, email);
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.userId).toBeTruthy();
      await deleteTestUser(request, email);
    });

    test('register with duplicate email returns 409', async ({ request }) => {
      const email = testEmail();
      await registerUser(request, email);
      const res = await registerUser(request, email);
      expect(res.status()).toBe(409);
      const body = await res.json();
      expect(body.error).toContain('already registered');
      await deleteTestUser(request, email);
    });

    test('register with short password returns 400', async ({ request }) => {
      const res = await registerUser(request, testEmail(), 'short');
      expect(res.status()).toBe(400);
      const body = await res.json();
      expect(body.error).toContain('8 characters');
    });

    test('register with invalid email returns 400', async ({ request }) => {
      const res = await request.post(`${BASE}/api/auth/register`, {
        data: { email: 'not-an-email', password: 'TestPass123!', name: 'Test' },
      });
      expect(res.status()).toBe(400);
      const body = await res.json();
      expect(body.error).toContain('Invalid email');
    });

    test('register with missing fields returns 400', async ({ request }) => {
      const res = await request.post(`${BASE}/api/auth/register`, {
        data: { email: testEmail() },
      });
      expect(res.status()).toBe(400);
    });
  });

  test.describe('Login Flow (UI)', () => {
    let email: string;
    const password = 'TestPass123!';

    test.beforeAll(async ({ request }) => {
      email = testEmail();
      await registerUser(request, email, password, 'Login Test User');
    });

    test.afterAll(async ({ request }) => {
      await deleteTestUser(request, email);
    });

    test('login with valid email and password redirects to dashboard', async ({ page }) => {
      await page.goto(`${BASE}/login`);
      await page.getByPlaceholder('you@example.com').fill(email);
      await page.getByPlaceholder('Enter password').fill(password);
      await page.getByRole('button', { name: /Sign In/i }).click();
      await page.waitForURL('**/dashboard**', { timeout: 10000 });
      expect(page.url()).toContain('/dashboard');
    });

    test('login with wrong password shows error', async ({ page }) => {
      await page.goto(`${BASE}/login`);
      await page.getByPlaceholder('you@example.com').fill(email);
      await page.getByPlaceholder('Enter password').fill('WrongPassword99!');
      await page.getByRole('button', { name: /Sign In/i }).click();
      await expect(page.getByText(/Invalid email or password/i)).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Registration Flow (UI)', () => {
    test('register via UI form and auto-login', async ({ page, request }) => {
      const email = testEmail();
      await page.goto(`${BASE}/login`);
      await page.getByText('Register').click();
      await page.getByPlaceholder('Your name').fill('UI Test User');
      await page.getByPlaceholder('you@example.com').fill(email);
      await page.getByPlaceholder('Min 8 characters').fill('TestPass123!');
      await page.getByPlaceholder('Repeat password').fill('TestPass123!');
      await page.getByText('Create Account').click();
      // Should auto-login and redirect to dashboard
      await page.waitForURL('**/dashboard**', { timeout: 15000 });
      expect(page.url()).toContain('/dashboard');
      await deleteTestUser(request, email);
    });

    test('register with mismatched passwords shows error', async ({ page }) => {
      await page.goto(`${BASE}/login`);
      await page.getByText('Register').click();
      await page.getByPlaceholder('Your name').fill('Mismatch User');
      await page.getByPlaceholder('you@example.com').fill(testEmail());
      await page.getByPlaceholder('Min 8 characters').fill('TestPass123!');
      await page.getByPlaceholder('Repeat password').fill('DifferentPass456!');
      await page.getByText('Create Account').click();
      await expect(page.getByText(/don't match/i)).toBeVisible({ timeout: 5000 });
    });
  });
});
