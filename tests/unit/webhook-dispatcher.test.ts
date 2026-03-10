import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHmac } from 'crypto';

const mockFindMany = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    webhook: {
      findMany: (...args: any[]) => mockFindMany(...args),
    },
  },
}));

// Mock fetch
const mockFetch = vi.fn().mockResolvedValue({ ok: true });
vi.stubGlobal('fetch', mockFetch);

describe('Webhook Dispatcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should dispatch to matching webhooks with HMAC signature', async () => {
    const secret = 'test-secret-hex';
    mockFindMany.mockResolvedValue([
      { id: 'wh1', url: 'https://example.com/hook', events: '["bug_report.created"]', secret, active: true },
    ]);

    const { dispatchWebhook } = await import('@/lib/webhook-dispatcher');
    await dispatchWebhook('bug_report.created', { id: 'bug1' }, 'user1');

    // Wait for fire-and-forget
    await new Promise(r => setTimeout(r, 50));

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe('https://example.com/hook');
    expect(opts.headers['Content-Type']).toBe('application/json');

    // Verify HMAC
    const body = opts.body;
    const expectedSig = createHmac('sha256', secret).update(body).digest('hex');
    expect(opts.headers['X-ClawQA-Signature']).toBe(`sha256=${expectedSig}`);
  });

  it('should not dispatch for non-matching events', async () => {
    mockFindMany.mockResolvedValue([
      { id: 'wh1', url: 'https://example.com/hook', events: '["test_cycle.completed"]', secret: 'sec', active: true },
    ]);

    const { dispatchWebhook } = await import('@/lib/webhook-dispatcher');
    await dispatchWebhook('bug_report.created', { id: 'bug1' }, 'user1');
    await new Promise(r => setTimeout(r, 50));

    expect(mockFetch).not.toHaveBeenCalled();
  });
});
