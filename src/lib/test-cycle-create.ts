import { prisma } from '@/lib/prisma';
import { isValidUrl, normalizeSteps, normalizeStringArray } from '@/lib/test-cycle-normalization';

export type CreateTestCycleInput = {
  projectId: string;
  title: string;
  description: string;
  targetUrl: string;
  priority?: string;
  inScope: string;
  outOfScope?: string;
  setupInstructions?: string;
  issueReportingInstructions: string;
  deviceRequirements: unknown;
  browserRequirements?: unknown;
  buildVersion?: string;
  steps: unknown;
};

const ALLOWED_PRIORITIES = new Set(['low', 'normal', 'high', 'critical']);

function cleanString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export async function createTestCycleFromInput(input: CreateTestCycleInput) {
  const projectId = cleanString(input.projectId);
  const title = cleanString(input.title);
  const description = cleanString(input.description);
  const targetUrl = cleanString(input.targetUrl);
  const priority = cleanString(input.priority) || 'normal';
  const inScope = cleanString(input.inScope);
  const outOfScope = cleanString(input.outOfScope);
  const setupInstructions = cleanString(input.setupInstructions);
  const issueReportingInstructions = cleanString(input.issueReportingInstructions);
  const buildVersion = cleanString(input.buildVersion);

  const normalizedSteps = normalizeSteps(input.steps);
  const normalizedDevices = normalizeStringArray(input.deviceRequirements);
  const normalizedBrowsers = normalizeStringArray(input.browserRequirements);

  if (!projectId) throw new Error('projectId is required');
  if (!title) throw new Error('title is required');
  if (!description) throw new Error('description is required');
  if (!targetUrl) throw new Error('targetUrl is required');
  if (!isValidUrl(targetUrl)) throw new Error('targetUrl must be a valid URL');
  if (!inScope) throw new Error('inScope is required');
  if (!issueReportingInstructions) throw new Error('issueReportingInstructions is required');
  if (!normalizedDevices.length) throw new Error('At least one device requirement is required');
  if (!normalizedSteps.length) throw new Error('At least one valid test step is required');
  if (!ALLOWED_PRIORITIES.has(priority)) throw new Error('priority must be one of: low, normal, high, critical');

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new Error('Project not found');

  return prisma.testCycle.create({
    data: {
      projectId,
      title,
      description,
      targetUrl,
      priority,
      stepsJson: JSON.stringify(normalizedSteps),
      deviceReqs: JSON.stringify(normalizedDevices),
      inScope,
      outOfScope,
      setupInstructions,
      issueReportingInstructions,
      browserReqs: JSON.stringify(normalizedBrowsers),
      buildVersion,
    },
    include: { project: { select: { id: true, name: true, slug: true } } },
  });
}
