import { describe, it, expect } from "vitest";
import { calculatePriorityScore, shouldBlockRelease } from "@/lib/priority-scoring";

describe("Priority Scoring", () => {
  it("scores critical severity highest", () => {
    expect(calculatePriorityScore("critical", "{}")).toBe(100);
  });

  it("scores major severity at 70", () => {
    expect(calculatePriorityScore("major", "{}")).toBe(70);
  });

  it("adds bonus for mobile devices", () => {
    const score = calculatePriorityScore("critical", '{"platform":"iOS 17"}');
    expect(score).toBe(115);
  });

  it("defaults unknown severity to 20", () => {
    expect(calculatePriorityScore("unknown", "{}")).toBe(20);
  });

  it("shouldBlockRelease true for critical", () => {
    expect(shouldBlockRelease("critical")).toBe(true);
  });

  it("shouldBlockRelease false for minor", () => {
    expect(shouldBlockRelease("minor")).toBe(false);
  });
});
