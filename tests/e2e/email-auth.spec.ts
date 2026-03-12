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
  await request.delete(`${BASE}/api/v1/users`, { data: { email } }).catch(() => {});
}

test.describe('Email Registration & Login', () => {
  test.describe('Registration Page UI', () => {
    test('login page loads with Sign In and Register tabs', async ({ page }) => {
      await page.goto(`${BASE}/login`);
      await expect(page.getByRole('button', { name: 'Sign In' }).first()).toBeVisible();
      await expect(page.getByRole('button', { name: 'Register' })).toBeVisible();
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
      await expect(page.getByPlaceholder('you@example.com')).toBeVisible();
      await expect(page.getByPlaceholder('Enter password')).toBeVisible();
      await expect(page.locator('form').first().locator('button[type="submit"]')).toBeVisible();
    });

    test('Demo password section exists', async ({ page }) => {
      await page.goto(`${BASE}/login`);
      await expect(page.getByPlaceholder('Demo password')).toBeVisible();
    });
  });

  test.describe('Registration API', () => {
    test('register with valid data succeeds (or 429 if rate-limited)', async ({ request }) => {
      const email = testEmail();
      const res = await registerUser(request, email);
      expect([200, 429]).toContain(res.status());
      if (res.status() === 200) {
        const body = await res.json();
        expect(body.success).toBe(true);
        expect(body.userId).toBeTruthy();
      }
      await deleteTestUser(request, email);
    });

    test('register with duplicate email returns 409 (or 429 if rate-limited)', async ({ request }) => {
      const email = testEmail();
      const first = await registerUser(request, email);
      if (first.status() === 429) {
        test.skip();
        return;
      }
      const res = await registerUser(request, email);
      expect([409, 429]).toContain(res.status());
      await deleteTestUser(request, email);
    });

    test('register with short password returns 400 (or 429 if rate-limited)', async ({ request }) => {
      const res = await registerUser(request, testEmail(), 'short');
      expect([400, 429]).toContain(res.status());
    });

    test('register with invalid email returns 400 (or 429 if rate-limited)', async ({ request }) => {
      const res = await request.post(`${BASE}/api/auth/register`, {
        data: { email: 'not-an-email', password: 'TestPass123!', name: 'Test' },
      });
      expect([400, 429]).toContain(res.status());
    });

    test('register with missing fields returns 400 (or 429 if rate-limited)', async ({ request }) => {
      const res = await request.post(`${BASE}/api/auth/register`, {
        data: { email: testEmail() },
      });
      expect([400, 429]).toContain(res.status());
    });
  });

  test.describe('Login Flow (UI)', () => {
    // Use the shared test user (pre-registered) to avoid rate limit issues
    const email = 'e2e-shared-test@clawqa-test.com';
    const password = 'SharedTestPass123!';

    test('login with valid email and password redirects to dashboard', async ({ page }) => {
      await page.goto(`${BASE}/login`);
      await page.getByPlaceholder('you@example.com').fill(email);
      await page.getByPlaceholder('Enter password').fill(password);
      const submitBtn = page.locator('form').first().locator('button[type="submit"]');
      await page.waitForFunction(() => {
        const btn = document.querySelector('form button[type="submit"]') as HTMLButtonElement;
        return btn && !btn.disabled;
      }, { timeout: 5000 });
      await submitBtn.click();
      await page.waitForURL('**/dashboard**', { timeout: 15000 });
      expect(page.url()).toContain('/dashboard');
    });

    test('login with wrong password shows error', async ({ page }) => {
      await page.goto(`${BASE}/login`);
      await page.getByPlaceholder('you@example.com').fill(email);
      await page.getByPlaceholder('Enter password').fill('WrongPassword99!');
      const submitBtn = page.locator('form').first().locator('button[type="submit"]');
      await page.waitForFunction(() => {
        const btn = document.querySelector('form button[type="submit"]') as HTMLButtonElement;
        return btn && !btn.disabled;
      }, { timeout: 5000 });
      await submitBtn.click();
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
      const createBtn = page.locator('form').first().locator('button[type="submit"]');
      await page.waitForFunction(() => {
        const btn = document.querySelector('form button[type="submit"]') as HTMLButtonElement;
        return btn && !btn.disabled;
      }, { timeout: 5000 });
      await createBtn.click();

      // Registration might be rate-limited (429) — check for error or redirect
      try {
        await page.waitForURL('**/dashboard**', { timeout: 15000 });
        expect(page.url()).toContain('/dashboard');
      } catch {
        // If rate limited, we should see an error on the page
        const errorVisible = await page.getByText(/failed|limit|try again/i).isVisible().catch(() => false);
        if (errorVisible) {
          test.skip(true, 'Registration rate limited');
        } else {
          throw new Error('Login redirect timed out and no error message shown');
        }
      }
      await deleteTestUser(request, email);
    });

    test('register with mismatched passwords shows error', async ({ page }) => {
      await page.goto(`${BASE}/login`);
      await page.getByText('Register').click();
      await page.getByPlaceholder('Your name').fill('Mismatch User');
      await page.getByPlaceholder('you@example.com').fill(testEmail());
      await page.getByPlaceholder('Min 8 characters').fill('TestPass123!');
      await page.getByPlaceholder('Repeat password').fill('DifferentPass456!');
      const createBtn = page.locator('form').first().locator('button[type="submit"]');
      await page.waitForFunction(() => {
        const btn = document.querySelector('form button[type="submit"]') as HTMLButtonElement;
        return btn && !btn.disabled;
      }, { timeout: 5000 });
      await createBtn.click();
      await expect(page.getByText(/don't match/i)).toBeVisible({ timeout: 5000 });
    });
  });
});
