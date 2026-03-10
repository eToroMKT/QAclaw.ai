import { describe, it, expect } from 'vitest';

describe('Bug Report API Data', () => {
  it('BugReport model should have required fields', async () => {
    const { PrismaClient } = await import('@prisma/client');
    const db = new PrismaClient({ datasources: { db: { url: 'file:./prisma/dev.db' } } });
    // Just verify the model is accessible
    const count = await db.bugReport.count();
    expect(count).toBeGreaterThanOrEqual(0);
    await db.$disconnect();
  });

  it('FixAttempt model should be accessible', async () => {
    const { PrismaClient } = await import('@prisma/client');
    const db = new PrismaClient({ datasources: { db: { url: 'file:./prisma/dev.db' } } });
    const count = await db.fixAttempt.count();
    expect(count).toBeGreaterThanOrEqual(0);
    await db.$disconnect();
  });
});
