import { test, expect } from '@playwright/test';

const BASE = 'https://clawqa.ai';
const API_KEY = 'cqa_e2e_test_key_' + 'a'.repeat(48);
const AUTH = { 'Authorization': `Bearer ${API_KEY}` };

test.describe('Test Cycle Detail - API', () => {
  // Use a known cycle ID from the database
  const KNOWN_CYCLE_ID = 'cycle-clawqa-oauth';

  test('GET /api/v1/test-cycles lists all cycles', async ({ request }) => {
    const res = await request.get(`${BASE}/api/v1/test-cycles`);
    expect(res.status()).toBe(200);
    const cycles = await res.json();
    expect(Array.isArray(cycles)).toBe(true);
    expect(cycles.length).toBeGreaterThan(0);
  });

  test('GET /api/v1/test-cycles/:id returns cycle detail', async ({ request }) => {
    const res = await request.get(`${BASE}/api/v1/test-cycles/${KNOWN_CYCLE_ID}`);
    expect(res.status()).toBe(200);
    const cycle = await res.json();
    expect(cycle.id).toBe(KNOWN_CYCLE_ID);
    expect(cycle.title).toBeTruthy();
    expect(cycle.project).toBeTruthy();
  });

  test('GET /api/v1/test-cycles/:id returns 404 for nonexistent', async ({ request }) => {
    const res = await request.get(`${BASE}/api/v1/test-cycles/nonexistent-cycle-id`);
    expect(res.status()).toBe(404);
  });

  test('GET /api/v1/test-cycles/:id/bugs returns array', async ({ request }) => {
    const res = await request.get(`${BASE}/api/v1/test-cycles/${KNOWN_CYCLE_ID}/bugs`);
    // Should return 200 with array (possibly empty) or 404
    expect([200, 404]).toContain(res.status());
    if (res.status() === 200) {
      const bugs = await res.json();
      expect(Array.isArray(bugs)).toBe(true);
    }
  });
});

test.describe('Bug Reports - API', () => {
  let createdBugId: string;

  test('GET /api/v1/bugs returns array', async ({ request }) => {
    const res = await request.get(`${BASE}/api/v1/bugs`);
    expect(res.status()).toBe(200);
    const bugs = await res.json();
    expect(Array.isArray(bugs)).toBe(true);
  });

  test('POST /api/v1/bugs returns 401 without auth', async ({ request }) => {
    const res = await request.post(`${BASE}/api/v1/bugs`, {
      data: { title: 'Unauthorized bug' },
    });
    expect(res.status()).toBe(401);
  });

  test('POST /api/v1/bugs creates a bug report', async ({ request }) => {
    const res = await request.post(`${BASE}/api/v1/bugs`, {
      headers: AUTH,
      data: {
        cycleId: 'cycle-clawqa-oauth',
        title: 'E2E Test Bug — Login button misaligned',
        severity: 'low',
        stepsToReproduce: '1. Open /login on mobile. 2. Observe button alignment',
        expectedResult: 'Button centered',
        actualResult: 'Button shifted 2px right',
      },
    });
    // Might be 201 or 200 depending on implementation
    expect([200, 201]).toContain(res.status());
    const bug = await res.json();
    if (bug.id) {
      createdBugId = bug.id;
      expect(bug.title).toContain('E2E Test Bug');
    }
  });
});

test.describe('Test Cycle Detail - UI', () => {
  test('test cycle detail page loads', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/test-cycles/cycle-clawqa-oauth`);
    // Should redirect to login (auth required)
    await page.waitForURL('**/login**', { timeout: 10000 });
    expect(page.url()).toContain('/login');
  });
});
