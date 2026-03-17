/**
 * Applause On-Demand Sync Service
 *
 * Fetches cycle status + bugs from Applause Public API v2,
 * upserts into ClawQA DB, respects a 5-minute TTL cache.
 */

import { prisma } from './prisma';
import { getApplausePublicApi, type ApplauseIssue } from './applause-public-api';
import { normalizeSteps, normalizeStringArray } from './test-cycle-normalization';

const SYNC_TTL_MS = 5 * 60 * 1000; // 5 minutes

export interface SyncResult {
  synced: boolean;
  bugsCreated: number;
  bugsUpdated: number;
  totalApplauseBugs: number;
  cycleStatus: string | null;
  lastSyncedAt: string;
  skippedReason?: string;
}

// ── TTL Check ────────────────────────────────────────────────────────

export async function shouldSync(cycleId: string): Promise<boolean> {
  const cycle = await prisma.testCycle.findUnique({
    where: { id: cycleId },
    select: { lastSyncedAt: true, applauseCycleId: true },
  });

  if (!cycle || !cycle.applauseCycleId) return false;
  if (!cycle.lastSyncedAt) return true;

  const elapsed = Date.now() - cycle.lastSyncedAt.getTime();
  return elapsed > SYNC_TTL_MS;
}

// ── Main Sync ────────────────────────────────────────────────────────

export async function syncCycleFromApplause(
  cycleId: string,
  force = false
): Promise<SyncResult> {
  const api = getApplausePublicApi();
  if (!api.isConfigured) {
    return {
      synced: false,
      bugsCreated: 0,
      bugsUpdated: 0,
      totalApplauseBugs: 0,
      cycleStatus: null,
      lastSyncedAt: new Date().toISOString(),
      skippedReason: 'Applause API key not configured',
    };
  }

  // Load ClawQA cycle
  const cycle = await prisma.testCycle.findUnique({
    where: { id: cycleId },
    include: { project: { select: { ownerId: true } } },
  });

  if (!cycle) {
    throw new Error(`Cycle ${cycleId} not found`);
  }

  if (!cycle.applauseCycleId) {
    return {
      synced: false,
      bugsCreated: 0,
      bugsUpdated: 0,
      totalApplauseBugs: 0,
      cycleStatus: cycle.status,
      lastSyncedAt: new Date().toISOString(),
      skippedReason: 'No Applause cycle linked (applauseCycleId is null)',
    };
  }

  // TTL check (skip if recently synced, unless forced)
  if (!force && cycle.lastSyncedAt) {
    const elapsed = Date.now() - cycle.lastSyncedAt.getTime();
    if (elapsed < SYNC_TTL_MS) {
      console.log(`[applause-sync] Skipping cycle ${cycleId} — synced ${Math.round(elapsed / 1000)}s ago`);
      return {
        synced: false,
        bugsCreated: 0,
        bugsUpdated: 0,
        totalApplauseBugs: 0,
        cycleStatus: cycle.applauseStatus || cycle.status,
        lastSyncedAt: cycle.lastSyncedAt.toISOString(),
        skippedReason: `Recently synced (${Math.round(elapsed / 1000)}s ago, TTL is ${SYNC_TTL_MS / 1000}s)`,
      };
    }
  }

  console.log(`[applause-sync] Syncing cycle ${cycleId} (Applause ID: ${cycle.applauseCycleId})...`);

  // 1. Fetch cycle details (includes status + issue counts)
  const applauseCycle = await api.getTestCycle(cycle.applauseCycleId);
  console.log(`[applause-sync] Applause cycle status: ${applauseCycle.status}`);

  // 2. Fetch all bugs (paginated)
  let bugsCreated = 0;
  let bugsUpdated = 0;
  let totalApplauseBugs = 0;
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const bugsPage = await api.getTestCycleIssues(cycle.applauseCycleId, page, 50);
    totalApplauseBugs = bugsPage.totalElements;

    for (const issue of bugsPage.content) {
      const result = await upsertBug(issue, cycleId, cycle.project.ownerId);
      if (result === 'created') bugsCreated++;
      if (result === 'updated') bugsUpdated++;
    }

    hasMore = page < bugsPage.totalPages;
    page++;
  }

  // 3. Update cycle record
  const now = new Date();
  await prisma.testCycle.update({
    where: { id: cycleId },
    data: {
      applauseStatus: applauseCycle.status,
      lastSyncedAt: now,
      // Map Applause status to our status if the cycle is completed/closed
      ...(applauseCycle.status === 'CLOSED' || applauseCycle.status === 'COMPLETED'
        ? { status: 'completed' }
        : {}),
    },
  });

  console.log(
    `[applause-sync] Done: ${bugsCreated} created, ${bugsUpdated} updated, ${totalApplauseBugs} total bugs`
  );

  return {
    synced: true,
    bugsCreated,
    bugsUpdated,
    totalApplauseBugs,
    cycleStatus: applauseCycle.status,
    lastSyncedAt: now.toISOString(),
  };
}

// ── Bug Upsert ───────────────────────────────────────────────────────

function mapSeverity(severityId?: number, severity?: string): string {
  // Applause severity IDs: 1=Critical, 2=High/Major, 3=Medium/Normal, 4=Low/Minor, 5=Cosmetic
  switch (severityId) {
    case 1: return 'critical';
    case 2: return 'major';
    case 3: return 'normal';
    case 4: return 'minor';
    case 5: return 'cosmetic';
  }

  const s = (severity || '').toUpperCase();
  if (s === 'CRITICAL') return 'critical';
  if (s === 'HIGH' || s === 'MAJOR') return 'major';
  if (s === 'MEDIUM' || s === 'NORMAL') return 'normal';
  if (s === 'LOW' || s === 'MINOR') return 'minor';
  if (s === 'COSMETIC') return 'cosmetic';
  return 'minor';
}

function mapStatus(applauseStatus?: string): string {
  if (!applauseStatus) return 'new';
  const s = applauseStatus.toUpperCase();
  if (s === 'APPROVED') return 'approved';
  if (s === 'PENDING_APPROVAL' || s === 'PENDING APPROVAL') return 'pending';
  if (s === 'REJECTED' || s === 'DISCARDED') return 'rejected';
  if (s === 'DISPUTED') return 'disputed';
  if (s === 'UNDER_REVIEW' || s === 'UNDER REVIEW') return 'under_review';
  if (s === 'NEW_ISSUE' || s === 'NEW ISSUE') return 'new';
  return 'new';
}

async function upsertBug(
  issue: ApplauseIssue,
  cycleId: string,
  reporterId: string
): Promise<'created' | 'updated' | 'skipped'> {
  const existing = await prisma.bugReport.findUnique({
    where: { applauseIssueId: issue.id },
  });

  const bugData = {
    title: issue.subject || `Applause Issue #${issue.id}`,
    severity: mapSeverity(issue.severityId, issue.severity),
    status: mapStatus(issue.status),
    stepsToReproduce: issue.actionPerform || '',
    expectedResult: issue.expectedResult || '',
    actualResult: issue.actualResult || issue.errorMessage || '',
    deviceInfo: JSON.stringify({
      environment: issue.additionalEnvironmentInfo || '',
      applauseIssueId: issue.id,
      qualityRating: issue.qualityRatingId || '',
    }),
  };

  if (existing) {
    // Check if anything meaningful changed
    const changed =
      existing.title !== bugData.title ||
      existing.severity !== bugData.severity ||
      existing.status !== bugData.status;

    if (!changed) return 'skipped';

    await prisma.bugReport.update({
      where: { id: existing.id },
      data: bugData,
    });
    console.log(`[applause-sync] Updated bug ${existing.id} (Applause #${issue.id})`);
    return 'updated';
  }

  await prisma.bugReport.create({
    data: {
      ...bugData,
      cycleId,
      reporterId,
      applauseIssueId: issue.id,
      isAutoReport: true,
    },
  });
  console.log(`[applause-sync] Created bug for Applause issue #${issue.id}`);
  return 'created';
}

// ── Create Applause Cycle ────────────────────────────────────────────

const DEFAULT_TEMPLATE_CYCLE_ID = 536247; // Our existing Applause cycle
const DEFAULT_APPLAUSE_PRODUCT_ID = parseInt(process.env.APPLAUSE_PRODUCT_ID || '37174', 10);
const DEFAULT_APPLAUSE_CYCLE_DAYS = parseInt(process.env.APPLAUSE_DEFAULT_CYCLE_DAYS || '7', 10);

function joinSections(sections: Array<{ title?: string; body?: string | null }>): string | undefined {
  const content = sections
    .map(({ title, body }) => {
      const cleaned = typeof body === 'string' ? body.trim() : '';
      if (!cleaned) return '';
      return title ? `${title}:\n${cleaned}` : cleaned;
    })
    .filter(Boolean)
    .join('\n\n')
    .trim();

  return content || undefined;
}

function parseStepsJson(value: string): ReturnType<typeof normalizeSteps> {
  try {
    return normalizeSteps(JSON.parse(value || '[]'));
  } catch {
    return [];
  }
}

function parseStringArrayJson(value: string): string[] {
  try {
    return normalizeStringArray(JSON.parse(value || '[]'));
  } catch {
    return [];
  }
}

function formatApplauseSetupInstructions(cycle: {
  description: string;
  setupInstructions: string;
  buildVersion: string;
}): string | undefined {
  return joinSections([
    { title: 'Summary', body: cycle.description },
    { title: 'Setup', body: cycle.setupInstructions },
    { title: 'Build / Version', body: cycle.buildVersion },
  ]);
}

function formatApplauseInScope(cycle: {
  targetUrl: string;
  inScope: string;
  deviceReqs: string;
  browserReqs: string;
}): string | undefined {
  const devices = parseStringArrayJson(cycle.deviceReqs);
  const browsers = parseStringArrayJson(cycle.browserReqs);

  return joinSections([
    { title: 'Target URL', body: cycle.targetUrl },
    { title: 'Scope', body: cycle.inScope },
    { title: 'Devices / Platforms', body: devices.length ? devices.map(item => `- ${item}`).join('\n') : '' },
    { title: 'Browsers', body: browsers.length ? browsers.map(item => `- ${item}`).join('\n') : '' },
  ]);
}

function formatApplauseSpecialInstructions(cycle: { stepsJson: string }): string | undefined {
  const steps = parseStepsJson(cycle.stepsJson);
  if (!steps.length) return undefined;

  return `Test Steps:\n${steps
    .map((step, index) => {
      const expected = step.expectedResult ? `\n   Expected: ${step.expectedResult}` : '';
      return `${index + 1}. ${step.instruction}${expected}`;
    })
    .join('\n\n')}`;
}

export async function createApplauseCycle(
  clawqaCycleId: string,
  templateCycleId = DEFAULT_TEMPLATE_CYCLE_ID
): Promise<{ applauseCycleId: number; status: string }> {
  const api = getApplausePublicApi();
  if (!api.isConfigured) {
    throw new Error('Applause API key not configured');
  }

  const cycle = await prisma.testCycle.findUnique({
    where: { id: clawqaCycleId },
  });
  if (!cycle) throw new Error(`Cycle ${clawqaCycleId} not found`);
  if (cycle.applauseCycleId) {
    throw new Error(`Cycle already linked to Applause ID ${cycle.applauseCycleId}`);
  }

  console.log(`[applause-sync] Creating Applause cycle from template ${templateCycleId}...`);

  const now = new Date();
  const end = new Date(now.getTime() + DEFAULT_APPLAUSE_CYCLE_DAYS * 24 * 60 * 60 * 1000);

  const newCycle = await api.createTestCycle({
    templateTestCycleId: templateCycleId,
    productId: DEFAULT_APPLAUSE_PRODUCT_ID,
    startDate: now.toISOString(),
    endDate: end.toISOString(),
    name: cycle.title,
    setupInstructions: formatApplauseSetupInstructions(cycle),
    inScope: formatApplauseInScope(cycle),
    outOfScope: cycle.outOfScope?.trim() || undefined,
    issueReportingInstructions:
      cycle.issueReportingInstructions?.trim() ||
      'Please file bugs directly in Applause for ClawQA sync validation and triage.',
    specialInstructions: formatApplauseSpecialInstructions(cycle),
  });

  // Request activation
  try {
    await api.requestActivation(newCycle.id);
    console.log(`[applause-sync] Requested activation for Applause cycle ${newCycle.id}`);
  } catch (err: any) {
    console.warn(`[applause-sync] Activation request failed (may need manual activation): ${err.message}`);
  }

  const refreshedCycle = await api.getTestCycle(newCycle.id).catch(() => newCycle);

  // Link to ClawQA cycle
  await prisma.testCycle.update({
    where: { id: clawqaCycleId },
    data: {
      applauseCycleId: newCycle.id,
      applauseStatus: (refreshedCycle.status || newCycle.status || 'NEW') as string,
    },
  });

  return { applauseCycleId: newCycle.id, status: (refreshedCycle.status || newCycle.status || 'NEW') as string };
}

// ── Sync Status Helper ───────────────────────────────────────────────

export async function getSyncStatus(cycleId: string) {
  const cycle = await prisma.testCycle.findUnique({
    where: { id: cycleId },
    select: {
      applauseCycleId: true,
      applauseStatus: true,
      lastSyncedAt: true,
      status: true,
    },
  });

  if (!cycle) return null;

  const needsSync = cycle.applauseCycleId
    ? !cycle.lastSyncedAt || Date.now() - cycle.lastSyncedAt.getTime() > SYNC_TTL_MS
    : false;

  return {
    linked: !!cycle.applauseCycleId,
    applauseCycleId: cycle.applauseCycleId,
    applauseStatus: cycle.applauseStatus,
    clawqaStatus: cycle.status,
    lastSyncedAt: cycle.lastSyncedAt?.toISOString() || null,
    needsSync,
  };
}
