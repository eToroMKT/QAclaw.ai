import { test, expect } from '@playwright/test';

test.describe('V1 API', () => {
  test('GET /api/v1/projects returns projects', async ({ request }) => {
    const resp = await request.get('/api/v1/projects');
    expect(resp.status()).toBe(200);
    const data = await resp.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(2);
    const slugs = data.map((p: any) => p.slug);
    expect(slugs).toContain('clawdet');
    expect(slugs).toContain('clawqa');
  });

  test('GET /api/v1/test-cycles returns cycles', async ({ request }) => {
    const resp = await request.get('/api/v1/test-cycles');
    expect(resp.status()).toBe(200);
    const data = await resp.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(7);
  });

  test('POST /api/v1/escalate without config returns 503', async ({ request }) => {
    const resp = await request.post('/api/v1/escalate', {
      data: { cycleId: 'nonexistent' },
    });
    const data = await resp.json();
    expect(data.error).toContain('not configured');
  });

  test('POST /api/v1/escalate without cycleId returns 400', async ({ request }) => {
    const resp = await request.post('/api/v1/escalate', {
      data: {},
    });
    expect(resp.status()).toBe(400);
  });
});
