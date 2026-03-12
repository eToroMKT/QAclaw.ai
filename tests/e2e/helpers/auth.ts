import type { Page, APIRequestContext } from '@playwright/test';

const BASE = 'https://clawqa.ai';

// Shared test account — reused across ALL authenticated tests to avoid rate limiting
// (registration endpoint allows only 5 per hour per IP)
const SHARED_EMAIL = 'e2e-shared-test@clawqa-test.com';
const SHARED_PASSWORD = 'E2eSharedTest123!';
const SHARED_NAME = 'E2E Shared User';
let sharedUserReady = false;

export function testEmail(prefix = 'test') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@clawqa-test.com`;
}

export async function registerUser(
  request: APIRequestContext,
  email: string,
  password = 'TestPass123!',
  name = 'E2E Test User'
) {
  return request.post(`${BASE}/api/auth/register`, {
    data: { email, password, name },
  });
}

export async function deleteTestUser(request: APIRequestContext, email: string) {
  await request.delete(`${BASE}/api/v1/users`, { data: { email } }).catch(() => {});
}

/**
 * Ensure the shared test user exists. Idempotent — only registers once.
 * If rate-limited, tries to login with existing credentials (user may already exist).
 */
export async function ensureSharedUser(request: APIRequestContext) {
  if (sharedUserReady) return;
  const res = await registerUser(request, SHARED_EMAIL, SHARED_PASSWORD, SHARED_NAME);
  // 200 = created, 409 = already exists, 429 = rate limited (user likely exists from prior run)
  if (res.status() === 200 || res.status() === 409 || res.status() === 429) {
    sharedUserReady = true;
  }
}

/**
 * Login via the UI with the shared test account.
 * Handles the two-form page (email login + demo password)
 * by targeting the first form's submit button specifically.
 */
export async function loginViaUI(page: Page, email: string, password: string) {
  await page.goto(`${BASE}/login`);
  await page.getByPlaceholder('you@example.com').fill(email);
  await page.getByPlaceholder('Enter password').fill(password);
  // Wait for React state to update and enable the button
  const submitBtn = page.locator('form').first().locator('button[type="submit"]');
  await submitBtn.waitFor({ state: 'attached' });
  await page.waitForFunction(() => {
    const btn = document.querySelector('form button[type="submit"]') as HTMLButtonElement;
    return btn && !btn.disabled;
  }, { timeout: 5000 });
  await submitBtn.click();
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
}

/**
 * Login with the shared test user. Ensures user exists first.
 */
export async function loginAsSharedUser(page: Page, request: APIRequestContext) {
  await ensureSharedUser(request);
  await loginViaUI(page, SHARED_EMAIL, SHARED_PASSWORD);
}

/**
 * Register a fresh user + login in one shot. Returns the email for cleanup.
 * WARNING: Uses a registration slot (5/hour limit). Use loginAsSharedUser for most tests.
 */
export async function registerAndLogin(
  page: Page,
  request: APIRequestContext,
  prefix = 'test'
): Promise<string> {
  const email = testEmail(prefix);
  const password = 'TestPass123!';
  const res = await registerUser(request, email, password, 'E2E Test User');
  if (res.status() === 429) {
    throw new Error('Rate limited — skip authenticated tests');
  }
  await loginViaUI(page, email, password);
  return email;
}
