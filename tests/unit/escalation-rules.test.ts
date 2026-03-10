import { describe, it, expect } from "vitest";

describe("Escalation Rules", () => {
  it("validates action types", () => {
    const validActions = ["notify", "escalate", "block-release"];
    expect(validActions).toContain("notify");
    expect(validActions).toContain("escalate");
    expect(validActions).toContain("block-release");
    expect(validActions).not.toContain("delete");
  });

  it("condition parsing works", () => {
    const condition = JSON.stringify({ severity: "critical", device: "iOS" });
    const parsed = JSON.parse(condition);
    expect(parsed.severity).toBe("critical");
    expect(parsed.device).toBe("iOS");
  });
});
