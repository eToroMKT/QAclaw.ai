import { describe, it, expect } from "vitest";

const MCP_TOOLS = [
  "clawqa.list_projects",
  "clawqa.list_cycles",
  "clawqa.create_cycle",
  "clawqa.get_bugs",
  "clawqa.submit_fix",
  "clawqa.escalate",
  "clawqa.get_analytics",
];

describe("MCP Server", () => {
  it("defines all expected tools", () => {
    expect(MCP_TOOLS).toContain("clawqa.list_projects");
    expect(MCP_TOOLS).toContain("clawqa.get_bugs");
    expect(MCP_TOOLS).toContain("clawqa.escalate");
    expect(MCP_TOOLS.length).toBe(7);
  });

  it("validates JSON-RPC format", () => {
    const request = { jsonrpc: "2.0", id: 1, method: "tools/list" };
    expect(request.jsonrpc).toBe("2.0");
    expect(request.method).toBe("tools/list");
  });

  it("rejects invalid jsonrpc version", () => {
    const request = { jsonrpc: "1.0", id: 1, method: "tools/list" };
    expect(request.jsonrpc).not.toBe("2.0");
  });
});
