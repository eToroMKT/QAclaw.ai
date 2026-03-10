const SEVERITY_SCORES: Record<string, number> = {
  critical: 100,
  major: 70,
  minor: 30,
  cosmetic: 10,
};

export function calculatePriorityScore(severity: string, deviceInfo: string): number {
  const base = SEVERITY_SCORES[severity] || 20;
  let bonus = 0;
  try {
    const info = JSON.parse(deviceInfo || "{}");
    const platform = (info.platform || info.os || "").toLowerCase();
    if (platform.includes("ios") || platform.includes("android")) bonus += 15;
  } catch {}
  return base + bonus;
}

export function shouldBlockRelease(severity: string): boolean {
  return severity === "critical";
}
