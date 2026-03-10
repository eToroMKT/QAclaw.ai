import { describe, it, expect } from 'vitest';

describe('Test Cycles Data', () => {
  it('should have at least 22 test cycles', async () => {
    const { PrismaClient } = await import('@prisma/client');
    const db = new PrismaClient({ datasources: { db: { url: 'file:./prisma/dev.db' } } });
    const cycles = await db.testCycle.findMany();
    expect(cycles.length).toBeGreaterThanOrEqual(22);
    await db.$disconnect();
  });

  it('each cycle should have valid steps JSON', async () => {
    const { PrismaClient } = await import('@prisma/client');
    const db = new PrismaClient({ datasources: { db: { url: 'file:./prisma/dev.db' } } });
    const cycles = await db.testCycle.findMany();
    for (const cycle of cycles) {
      const steps = JSON.parse(cycle.stepsJson);
      expect(Array.isArray(steps)).toBe(true);
      expect(steps.length).toBeGreaterThan(0);
      for (const step of steps) {
        if (typeof step === 'string') {
          expect(step.length).toBeGreaterThan(5);
        } else {
          // Steps can have title/description/expectedResult OR instruction
          expect(typeof step === 'object').toBe(true);
          const hasTitle = 'title' in step;
          const hasInstruction = 'instruction' in step;
          expect(hasTitle || hasInstruction).toBe(true);
        }
      }
    }
    await db.$disconnect();
  });

  it('Clawdet should have at least 10 test cycles', async () => {
    const { PrismaClient } = await import('@prisma/client');
    const db = new PrismaClient({ datasources: { db: { url: 'file:./prisma/dev.db' } } });
    const clawdet = await db.project.findUnique({ where: { slug: 'clawdet' }, include: { testCycles: true } });
    expect(clawdet!.testCycles.length).toBeGreaterThanOrEqual(10);
    await db.$disconnect();
  });

  it('ClawQA should have at least 12 test cycles', async () => {
    const { PrismaClient } = await import('@prisma/client');
    const db = new PrismaClient({ datasources: { db: { url: 'file:./prisma/dev.db' } } });
    const clawqa = await db.project.findUnique({ where: { slug: 'clawqa' }, include: { testCycles: true } });
    expect(clawqa!.testCycles.length).toBeGreaterThanOrEqual(12);
    await db.$disconnect();
  });

  it('each cycle should have valid priority', async () => {
    const { PrismaClient } = await import('@prisma/client');
    const db = new PrismaClient({ datasources: { db: { url: 'file:./prisma/dev.db' } } });
    const cycles = await db.testCycle.findMany();
    const validPriorities = ['critical', 'high', 'medium', 'normal', 'low'];
    for (const cycle of cycles) {
      expect(validPriorities).toContain(cycle.priority);
    }
    await db.$disconnect();
  });
});
