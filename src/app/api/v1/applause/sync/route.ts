import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { syncCycleFromApplause, getSyncStatus, createApplauseCycle } from '@/lib/applause-sync';

/**
 * GET /api/v1/applause/sync?cycleId=xxx
 * Returns sync status for a cycle (is it linked? when was last sync? does it need syncing?)
 */
export async function GET(req: NextRequest) {
  const cycleId = req.nextUrl.searchParams.get('cycleId');
  if (!cycleId) {
    return NextResponse.json({ error: 'cycleId query param required' }, { status: 400 });
  }

  const status = await getSyncStatus(cycleId);
  if (!status) {
    return NextResponse.json({ error: 'Cycle not found' }, { status: 404 });
  }

  return NextResponse.json(status);
}

/**
 * POST /api/v1/applause/sync
 * Body: { cycleId: string, force?: boolean, action?: "sync" | "create" }
 *
 * action="sync" (default): Sync bugs from Applause into ClawQA
 * action="create": Create a new Applause cycle linked to this ClawQA cycle
 */
export async function POST(req: NextRequest) {
  const { user, response } = await requireAuth(req);
  if (response) return response;

  try {
    const body = await req.json();
    const { cycleId, force, action } = body as {
      cycleId: string;
      force?: boolean;
      action?: 'sync' | 'create';
    };

    if (!cycleId) {
      return NextResponse.json({ error: 'cycleId required' }, { status: 400 });
    }

    // Create a new Applause cycle
    if (action === 'create') {
      const result = await createApplauseCycle(cycleId, body.templateCycleId);
      return NextResponse.json(result, { status: 201 });
    }

    // Default: sync bugs from Applause
    const result = await syncCycleFromApplause(cycleId, force ?? false);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[applause-sync] API error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
