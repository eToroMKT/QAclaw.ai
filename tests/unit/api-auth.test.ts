import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHash } from 'crypto';

// Mock prisma
const mockFindUnique = vi.fn();
const mockUpdate = vi.fn().mockResolvedValue({});

vi.mock('@/lib/prisma', () => ({
  prisma: {
    apiKey: {
      findUnique: (...args: any[]) => mockFindUnique(...args),
      update: (...args: any[]) => mockUpdate(...args),
    },
  },
}));

describe('API Key Auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return null for missing Authorization header', async () => {
    const { authenticateApiKey } = await import('@/lib/api-auth');
    const req = { headers: { get: () => null } } as any;

    const result = await authenticateApiKey(req);
    expect(result).toBeNull();
  });

  it('should return null for invalid key', async () => {
    mockFindUnique.mockResolvedValue(null);
    const { authenticateApiKey } = await import('@/lib/api-auth');
    const headers = new Headers({ Authorization: 'Bearer clq_live_invalid' });
    const req = { headers: { get: (name: string) => headers.get(name) } } as any;
    const result = await authenticateApiKey(req);
    expect(result).toBeNull();
  });

  it('should return user for valid key', async () => {
    const testKey = 'clq_live_testkey123';
    const keyHash = createHash('sha256').update(testKey).digest('hex');
    const mockUser = { id: 'user1', name: 'Test', email: 'test@test.com' };
    mockFindUnique.mockResolvedValue({ id: 'key1', keyHash, user: mockUser, revokedAt: null });

    const { authenticateApiKey } = await import('@/lib/api-auth');
    const req = { headers: { get: (name: string) => name === 'authorization' ? `Bearer ${testKey}` : null } } as any;
    const result = await authenticateApiKey(req);
    expect(result).toEqual(mockUser);
  });

  it('should return null for revoked key', async () => {
    const testKey = 'clq_live_revoked';
    const keyHash = createHash('sha256').update(testKey).digest('hex');
    mockFindUnique.mockResolvedValue({ id: 'key2', keyHash, revokedAt: new Date(), user: { id: 'u1' } });

    const { authenticateApiKey } = await import('@/lib/api-auth');
    const req = { headers: { get: (name: string) => name === 'authorization' ? `Bearer ${testKey}` : null } } as any;
    const result = await authenticateApiKey(req);
    expect(result).toBeNull();
  });
});
