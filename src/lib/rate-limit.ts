const windowMs = 60_000;
const maxRequests = 100;

interface Entry { timestamps: number[] }
const store = new Map<string, Entry>();

// Cleanup every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter(t => now - t < windowMs);
    if (entry.timestamps.length === 0) store.delete(key);
  }
}, 300_000);

export function checkRateLimit(apiKey: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  let entry = store.get(apiKey);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(apiKey, entry);
  }
  entry.timestamps = entry.timestamps.filter(t => now - t < windowMs);
  if (entry.timestamps.length >= maxRequests) {
    const oldest = entry.timestamps[0];
    const retryAfter = Math.ceil((oldest + windowMs - now) / 1000);
    return { allowed: false, retryAfter };
  }
  entry.timestamps.push(now);
  return { allowed: true };
}
