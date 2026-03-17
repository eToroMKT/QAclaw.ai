import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRuntimeFlags } from '@/lib/runtime-flags';
import { createApplauseCycle } from '@/lib/applause-sync';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cycleId, reason, templateCycleId } = body;
    if (!cycleId) return NextResponse.json({ error: 'cycleId required' }, { status: 400 });

    const cycle = await prisma.testCycle.findUnique({ where: { id: cycleId }, include: { project: true } });
    if (!cycle) return NextResponse.json({ error: 'Test cycle not found' }, { status: 404 });

    const flags = await getRuntimeFlags();
    const note = `\n\n[Escalated to Testers: ${new Date().toISOString()}] mode=${flags.applauseAutoCreateOnEscalate ? 'auto_create_on_escalate' : 'manual_handoff'} Reason: ${reason || 'Manual verification needed'}`;

    if (!flags.applauseAutoCreateOnEscalate) {
      await prisma.testCycle.update({
        where: { id: cycleId },
        data: {
          status: 'escalated_to_applause',
          description: (cycle.description || '') + note,
        },
      });

      return NextResponse.json({
        success: true,
        mode: 'manual_handoff',
        cycleId,
        message: 'Cycle marked for manual tester escalation. No Applause cycle was created automatically.',
        nextAction: 'Use the manual Applause handoff flow when you want to involve external testers.',
      });
    }

    const created = cycle.applauseCycleId
      ? { applauseCycleId: cycle.applauseCycleId, status: cycle.applauseStatus || 'LINKED' }
      : await createApplauseCycle(cycleId, templateCycleId);

    await prisma.testCycle.update({
      where: { id: cycleId },
      data: {
        status: 'escalated_to_applause',
        description: (cycle.description || '') + note,
      },
    });

    return NextResponse.json({
      success: true,
      mode: 'auto_create_on_escalate',
      cycleId,
      applauseCycleId: created.applauseCycleId,
      applauseStatus: created.status,
      message: cycle.applauseCycleId
        ? 'Cycle was already linked to Applause and remains escalated.'
        : 'Applause cycle created and linked during escalation.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
