import { describe, it, expect } from "vitest";
import { checkRateLimit } from "@/lib/rate-limit";

describe("Rate Limiting", () => {
  it("allows requests under limit", () => {
    const key = "test-key-" + Date.now();
    const result = checkRateLimit(key);
    expect(result.allowed).toBe(true);
  });

  it("blocks after 100 requests", () => {
    const key = "flood-key-" + Date.now();
    for (let i = 0; i < 100; i++) {
      checkRateLimit(key);
    }
    const result = checkRateLimit(key);
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it("different keys have separate limits", () => {
    const key1 = "key1-" + Date.now();
    const key2 = "key2-" + Date.now();
    for (let i = 0; i < 100; i++) checkRateLimit(key1);
    expect(checkRateLimit(key1).allowed).toBe(false);
    expect(checkRateLimit(key2).allowed).toBe(true);
  });
});
