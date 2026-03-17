import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getRuntimeFlags, updateRuntimeFlags } from '@/lib/runtime-flags';

function canManageFlags(role?: string) {
  return role === 'agent-owner' || role === 'admin';
}

export async function GET() {
  const flags = await getRuntimeFlags();
  return NextResponse.json(flags);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as any)?.role;

  if (!session?.user?.id || !canManageFlags(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const patch: Record<string, unknown> = {};

  if (typeof body.applauseAutoCreateOnEscalate === 'boolean') {
    patch.applauseAutoCreateOnEscalate = body.applauseAutoCreateOnEscalate;
  }

  const flags = await updateRuntimeFlags(patch);
  return NextResponse.json(flags);
}
