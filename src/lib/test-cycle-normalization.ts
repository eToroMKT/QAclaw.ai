export type NormalizedStep = {
  instruction: string;
  expectedResult: string;
};

function cleanString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function normalizeStringArray(values: unknown): string[] {
  if (!Array.isArray(values)) return [];

  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const value of values) {
    const cleaned = cleanString(value);
    if (!cleaned) continue;
    if (seen.has(cleaned)) continue;
    seen.add(cleaned);
    normalized.push(cleaned);
  }

  return normalized;
}

export function normalizeSteps(steps: unknown): NormalizedStep[] {
  if (!Array.isArray(steps)) return [];

  const normalized: NormalizedStep[] = [];

  for (const step of steps) {
    if (typeof step === 'string') {
      const instruction = step.trim();
      if (!instruction) continue;
      normalized.push({ instruction, expectedResult: '' });
      continue;
    }

    if (step && typeof step === 'object') {
      const record = step as Record<string, unknown>;
      const instruction = cleanString(record.instruction);
      const expectedResult = cleanString(record.expectedResult);
      if (!instruction) continue;
      normalized.push({ instruction, expectedResult });
    }
  }

  return normalized;
}

export function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}
