import { describe, it, expect } from 'vitest';

describe('Database Schema', () => {
  it('should have all required models', async () => {
    const { PrismaClient } = await import('@prisma/client');
    const db = new PrismaClient({ datasources: { db: { url: 'file:./prisma/dev.db' } } });
    await db.user.findFirst();
    await db.project.findFirst();
    await db.testCycle.findFirst();
    await db.bugReport.findFirst();
    await db.fixAttempt.findFirst();
    await db.apiKey.findFirst();
    await db.$disconnect();
  });
});
