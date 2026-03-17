import { promises as fs } from 'fs';
import path from 'path';

export interface RuntimeFlags {
  applauseAutoCreateOnEscalate: boolean;
}

const DEFAULT_FLAGS: RuntimeFlags = {
  applauseAutoCreateOnEscalate: true,
};

function getFlagsPath() {
  return process.env.RUNTIME_FLAGS_FILE || path.join(process.cwd(), 'runtime-flags.json');
}

export async function getRuntimeFlags(): Promise<RuntimeFlags> {
  const filePath = getFlagsPath();

  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw || '{}');
    return {
      ...DEFAULT_FLAGS,
      ...parsed,
    };
  } catch {
    return DEFAULT_FLAGS;
  }
}

export async function updateRuntimeFlags(patch: Partial<RuntimeFlags>): Promise<RuntimeFlags> {
  const filePath = getFlagsPath();
  const next = {
    ...(await getRuntimeFlags()),
    ...patch,
  };

  await fs.writeFile(filePath, JSON.stringify(next, null, 2) + '\n', 'utf8');
  return next;
}
