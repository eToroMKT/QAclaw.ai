import { test, expect } from '@playwright/test';

const BASE = 'https://clawqa.ai';
const API_KEY = 'cqa_e2e_test_key_' + 'a'.repeat(48);
const AUTH = { 'Authorization': `Bearer ${API_KEY}` };

test.describe('Test Plans - API CRUD', () => {
  test.describe.configure({ mode: 'serial' });

  let createdPlanId: string;

  test('GET /api/v1/test-plans returns array (public)', async ({ request }) => {
    const res = await request.get(`${BASE}/api/v1/test-plans`);
    expect(res.status()).toBe(200);
    const plans = await res.json();
    expect(Array.isArray(plans)).toBe(true);
  });

  test('POST /api/v1/test-plans returns 401 without auth', async ({ request }) => {
    const res = await request.post(`${BASE}/api/v1/test-plans`, {
      data: { projectId: 'cmlu5qwin00035dz3r1j1msfh', title: 'Should Fail' },
    });
    expect(res.status()).toBe(401);
  });

  test('POST /api/v1/test-plans creates a plan', async ({ request }) => {
    const res = await request.post(`${BASE}/api/v1/test-plans`, {
      headers: AUTH,
      data: {
        projectId: 'cmlu5qwin00035dz3r1j1msfh',
        title: 'E2E Test Plan — Login Flow',
        description: 'Verify the full login flow works end to end',
        steps: [
          { step: 1, action: 'Navigate to /login', expected: 'Login page loads' },
          { step: 2, action: 'Enter email and password', expected: 'Fields are filled' },
          { step: 3, action: 'Click Sign In', expected: 'Redirects to /dashboard' },
        ],
        priority: 'high',
      },
    });
    expect(res.status()).toBe(201);
    const plan = await res.json();
    expect(plan.id).toBeTruthy();
    expect(plan.title).toBe('E2E Test Plan — Login Flow');
    createdPlanId = plan.id;
  });

  test('POST /api/v1/test-plans rejects missing fields', async ({ request }) => {
    const res = await request.post(`${BASE}/api/v1/test-plans`, {
      headers: AUTH,
      data: { description: 'No projectId or title' },
    });
    expect(res.status()).toBe(400);
  });

  test('POST /api/v1/test-plans rejects invalid project', async ({ request }) => {
    const res = await request.post(`${BASE}/api/v1/test-plans`, {
      headers: AUTH,
      data: { projectId: 'nonexistent', title: 'Should 404' },
    });
    expect(res.status()).toBe(404);
  });

  test('PUT /api/v1/test-plans updates a plan', async ({ request }) => {
    if (!createdPlanId) test.skip();
    const res = await request.put(`${BASE}/api/v1/test-plans`, {
      headers: AUTH,
      data: {
        id: createdPlanId,
        title: 'E2E Test Plan — Login Flow (Updated)',
        priority: 'critical',
      },
    });
    expect(res.status()).toBe(200);
    const updated = await res.json();
    expect(updated.title).toBe('E2E Test Plan — Login Flow (Updated)');
    expect(updated.version).toBe(2);
  });

  test('GET /api/v1/test-plans includes created plan', async ({ request }) => {
    if (!createdPlanId) test.skip();
    const res = await request.get(`${BASE}/api/v1/test-plans`);
    const plans = await res.json();
    const found = plans.find((p: any) => p.id === createdPlanId);
    expect(found).toBeTruthy();
    expect(found.title).toContain('Updated');
  });
});

test.describe('Test Plans - Dashboard UI', () => {
  test('test plans page loads (unauthenticated redirects to login)', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/test-plans`);
    await page.waitForURL('**/login**', { timeout: 10000 });
    expect(page.url()).toContain('/login');
  });
});
