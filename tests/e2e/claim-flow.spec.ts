import { test, expect } from '@playwright/test';
import { loginViaUI } from './helpers/auth';

const BASE = 'https://clawqa.ai';
const CYCLE_ID = 'cycle-clawqa-oauth';

test.describe('Test Cycle Claim & Submit Flow', () => {
  test.describe.configure({ mode: 'serial' });

  let context: import('@playwright/test').BrowserContext;
  let page: import('@playwright/test').Page;
  let executionId: string;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
    await loginViaUI(page, 'e2e-shared-test@clawqa-test.com', 'SharedTestPass123!');
  });

  test.afterAll(async () => {
    // Clean up: release any claimed tests so future runs aren't blocked
    if (executionId) {
      try {
        await context.request.post(`${BASE}/api/my-tests/${executionId}/submit`, {
          data: { results: [{ step: 'cleanup', status: 'pass' }] },
        });
      } catch {}
    }
    await context?.close();
  });

  test('GET /api/my-tests returns empty or existing list', async () => {
    const res = await context.request.get(`${BASE}/api/my-tests`);
    expect(res.status()).toBe(200);
    const tests = await res.json();
    expect(Array.isArray(tests)).toBe(true);
  });

  test('GET /api/my-tests returns 401 without session', async ({ request }) => {
    const res = await request.get(`${BASE}/api/my-tests`);
    expect(res.status()).toBe(401);
  });

  test('POST /api/test-cycles/claim claims a test cycle', async () => {
    const res = await context.request.post(`${BASE}/api/test-cycles/claim`, {
      data: { cycleId: CYCLE_ID },
    });
    expect(res.status()).toBe(201);
    const execution = await res.json();
    expect(execution.id).toBeTruthy();
    expect(execution.cycleId).toBe(CYCLE_ID);
    expect(execution.status).toBe('claimed');
    executionId = execution.id;
  });

  test('POST /api/test-cycles/claim returns 401 without session', async ({ request }) => {
    const res = await request.post(`${BASE}/api/test-cycles/claim`, {
      data: { cycleId: CYCLE_ID },
    });
    expect(res.status()).toBe(401);
  });

  test('GET /api/my-tests includes claimed execution', async () => {
    if (!executionId) test.skip();
    const res = await context.request.get(`${BASE}/api/my-tests`);
    expect(res.status()).toBe(200);
    const tests = await res.json();
    const found = tests.find((t: any) => t.id === executionId);
    expect(found).toBeTruthy();
    expect(found.status).toBe('claimed');
    expect(found.cycle).toBeTruthy();
  });

  test('GET /api/my-tests/:id returns execution detail', async () => {
    if (!executionId) test.skip();
    const res = await context.request.get(`${BASE}/api/my-tests/${executionId}`);
    expect(res.status()).toBe(200);
    const execution = await res.json();
    expect(execution.id).toBe(executionId);
    expect(execution.cycle.project).toBeTruthy();
  });

  test('GET /api/my-tests/:id returns 404 for wrong id', async () => {
    const res = await context.request.get(`${BASE}/api/my-tests/nonexistent-id`);
    expect(res.status()).toBe(404);
  });

  test('POST /api/my-tests/:id/submit submits results', async () => {
    if (!executionId) test.skip();
    const res = await context.request.post(`${BASE}/api/my-tests/${executionId}/submit`, {
      data: {
        results: [
          { step: 'Navigate to login page', status: 'pass', notes: 'Page loaded correctly' },
          { step: 'Enter credentials', status: 'pass', notes: 'Fields accepted input' },
          { step: 'Click submit', status: 'pass', notes: 'Redirected to dashboard' },
        ],
      },
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  test('GET /api/my-tests/:id shows submitted status after submit', async () => {
    if (!executionId) test.skip();
    const res = await context.request.get(`${BASE}/api/my-tests/${executionId}`);
    expect(res.status()).toBe(200);
    const execution = await res.json();
    expect(execution.status).toBe('submitted');
    expect(execution.completedAt).toBeTruthy();
  });

  test('claim limit: max 3 active tests enforced', async () => {
    // Claim 3 more (we already submitted one, so slot should be free)
    const ids: string[] = [];
    for (let i = 0; i < 3; i++) {
      const res = await context.request.post(`${BASE}/api/test-cycles/claim`, {
        data: { cycleId: CYCLE_ID },
      });
      if (res.status() === 201) {
        const ex = await res.json();
        ids.push(ex.id);
      }
    }

    // 4th claim should be rejected
    const res = await context.request.post(`${BASE}/api/test-cycles/claim`, {
      data: { cycleId: CYCLE_ID },
    });
    expect(res.status()).toBe(429);
    const err = await res.json();
    expect(err.error).toContain('Max 3');

    // Cleanup: submit all claimed tests
    for (const id of ids) {
      await context.request.post(`${BASE}/api/my-tests/${id}/submit`, {
        data: { results: [{ step: 'cleanup', status: 'pass' }] },
      });
    }
  });

  test('session bug reporting via /api/bugs/session', async () => {
    const res = await context.request.post(`${BASE}/api/bugs/session`, {
      data: {
        cycleId: CYCLE_ID,
        title: 'E2E Claim Flow Bug Report',
        severity: 'minor',
        stepsToReproduce: 'Step 1: Do X. Step 2: Observe Y.',
        expectedResult: 'Y should not happen',
        actualResult: 'Y happened',
      },
    });
    expect(res.status()).toBe(201);
    const bug = await res.json();
    expect(bug.id).toBeTruthy();
    expect(bug.title).toBe('E2E Claim Flow Bug Report');
  });

  test('GET /api/bugs/session/mine returns my bugs', async () => {
    const res = await context.request.get(`${BASE}/api/bugs/session/mine`);
    expect(res.status()).toBe(200);
    const bugs = await res.json();
    expect(Array.isArray(bugs)).toBe(true);
    const found = bugs.find((b: any) => b.title === 'E2E Claim Flow Bug Report');
    expect(found).toBeTruthy();
  });
});
