import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    project: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

describe('Projects API Data', () => {
  it('should have Clawdet and ClawQA projects', async () => {
    const { PrismaClient } = await import('@prisma/client');
    const db = new PrismaClient({ datasources: { db: { url: 'file:./prisma/dev.db' } } });
    const projects = await db.project.findMany();
    expect(projects.length).toBeGreaterThanOrEqual(2);
    const slugs = projects.map(p => p.slug);
    expect(slugs).toContain('clawdet');
    expect(slugs).toContain('clawqa');
    await db.$disconnect();
  });

  it('Clawdet should have correct data', async () => {
    const { PrismaClient } = await import('@prisma/client');
    const db = new PrismaClient({ datasources: { db: { url: 'file:./prisma/dev.db' } } });
    const clawdet = await db.project.findUnique({ where: { slug: 'clawdet' } });
    expect(clawdet).toBeTruthy();
    expect(clawdet!.name).toBe('Clawdet');
    expect(clawdet!.targetUrl).toContain('clawdet.com');
    await db.$disconnect();
  });

  it('ClawQA should have correct data', async () => {
    const { PrismaClient } = await import('@prisma/client');
    const db = new PrismaClient({ datasources: { db: { url: 'file:./prisma/dev.db' } } });
    const clawqa = await db.project.findUnique({ where: { slug: 'clawqa' } });
    expect(clawqa).toBeTruthy();
    expect(clawqa!.name).toContain('ClawQA');
    expect(clawqa!.targetUrl).toContain('clawqa.ai');
    await db.$disconnect();
  });
});
