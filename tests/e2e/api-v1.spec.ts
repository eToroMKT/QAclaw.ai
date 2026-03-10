import { test, expect } from '@playwright/test';

test.describe('V1 API - Auth Required Endpoints', () => {
  test('POST /api/v1/test-cycles returns 401 without auth', async ({ request }) => {
    const resp = await request.post('/api/v1/test-cycles', {
      data: { projectId: 'test', title: 'Test', targetUrl: 'http://test.com', steps: [{ instruction: 'test', expectedResult: 'pass' }] },
    });
    expect(resp.status()).toBe(401);
    const data = await resp.json();
    expect(data.error).toBe('Unauthorized');
  });

  test('POST /api/v1/bugs returns 401 without auth', async ({ request }) => {
    const resp = await request.post('/api/v1/bugs', {
      data: { cycleId: 'test', title: 'Bug', severity: 'minor' },
    });
    expect(resp.status()).toBe(401);
    const data = await resp.json();
    expect(data.error).toBe('Unauthorized');
  });

  test('GET /api/v1/bugs returns array', async ({ request }) => {
    const resp = await request.get('/api/v1/bugs');
    expect(resp.status()).toBe(200);
    const data = await resp.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test('GET /api/v1/test-cycles/:id/bugs returns 404 for invalid cycle', async ({ request }) => {
    const resp = await request.get('/api/v1/test-cycles/nonexistent/bugs');
    expect(resp.status()).toBe(404);
  });

  test('POST /api/v1/webhooks returns 401 without auth', async ({ request }) => {
    const resp = await request.post('/api/v1/webhooks', {
      data: { url: 'https://example.com', events: ['bug_report.created'] },
    });
    expect(resp.status()).toBe(401);
  });
});
