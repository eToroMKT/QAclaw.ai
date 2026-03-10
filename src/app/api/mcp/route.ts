import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { calculatePriorityScore, shouldBlockRelease } from "@/lib/priority-scoring";
import { evaluateEscalationRules } from "@/lib/escalation-engine";
import { dispatchWebhook } from "@/lib/webhook-dispatcher";

const MCP_TOOLS = [
  {
    name: "clawqa.list_projects",
    description: "List all projects",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "clawqa.list_cycles",
    description: "List test cycles, optionally filtered by projectId",
    inputSchema: {
      type: "object",
      properties: { projectId: { type: "string", description: "Optional project ID filter" } },
      required: [],
    },
  },
  {
    name: "clawqa.create_cycle",
    description: "Create a new test cycle with steps",
    inputSchema: {
      type: "object",
      properties: {
        projectId: { type: "string" },
        title: { type: "string" },
        targetUrl: { type: "string" },
        steps: { type: "array", items: { type: "object" } },
        description: { type: "string" },
      },
      required: ["projectId", "title", "targetUrl", "steps"],
    },
  },
  {
    name: "clawqa.get_bugs",
    description: "Get bugs for a cycle or all bugs",
    inputSchema: {
      type: "object",
      properties: {
        cycleId: { type: "string" },
        severity: { type: "string", enum: ["critical", "major", "minor", "cosmetic"] },
      },
      required: [],
    },
  },
  {
    name: "clawqa.submit_fix",
    description: "Submit a fix for a bug",
    inputSchema: {
      type: "object",
      properties: {
        bugId: { type: "string" },
        commitUrl: { type: "string" },
        notes: { type: "string" },
      },
      required: ["bugId"],
    },
  },
  {
    name: "clawqa.escalate",
    description: "Escalate a test cycle to CrowdTesting crowd testing",
    inputSchema: {
      type: "object",
      properties: {
        cycleId: { type: "string" },
        reason: { type: "string" },
      },
      required: ["cycleId"],
    },
  },
  {
    name: "clawqa.get_analytics",
    description: "Get project analytics summary",
    inputSchema: {
      type: "object",
      properties: { projectId: { type: "string" } },
      required: [],
    },
  },
];

async function authenticateMcp(apiKey: string) {
  if (!apiKey) return null;
  const keyHash = createHash("sha256").update(apiKey).digest("hex");
  const key = await prisma.apiKey.findUnique({ where: { keyHash }, include: { user: true } });
  if (!key || key.revokedAt) return null;
  return key.user;
}

async function executeTool(name: string, args: any, userId: string) {
  switch (name) {
    case "clawqa.list_projects": {
      const projects = await prisma.project.findMany({
        include: { testCycles: { select: { id: true, title: true, status: true } } },
        orderBy: { createdAt: "desc" },
      });
      return projects;
    }
    case "clawqa.list_cycles": {
      const where = args.projectId ? { projectId: args.projectId } : {};
      return prisma.testCycle.findMany({
        where,
        include: { project: { select: { id: true, name: true, slug: true } } },
        orderBy: { createdAt: "desc" },
      });
    }
    case "clawqa.create_cycle": {
      const { projectId, title, targetUrl, steps, description } = args;
      if (!projectId || !title || !targetUrl || !steps?.length) {
        throw new Error("Missing required: projectId, title, targetUrl, steps");
      }
      const project = await prisma.project.findUnique({ where: { id: projectId } });
      if (!project) throw new Error("Project not found");
      return prisma.testCycle.create({
        data: {
          projectId, title, targetUrl,
          description: description || "",
          stepsJson: JSON.stringify(steps),
        },
      });
    }
    case "clawqa.get_bugs": {
      const where: any = {};
      if (args.cycleId) where.cycleId = args.cycleId;
      if (args.severity) where.severity = args.severity;
      return prisma.bugReport.findMany({ where, orderBy: { createdAt: "desc" } });
    }
    case "clawqa.submit_fix": {
      const { bugId, commitUrl, notes } = args;
      if (!bugId) throw new Error("bugId required");
      const bug = await prisma.bugReport.findUnique({ where: { id: bugId } });
      if (!bug) throw new Error("Bug not found");
      const fix = await prisma.fixAttempt.create({
        data: { bugId, commitUrl: commitUrl || "", notes: notes || "" },
      });
      await prisma.bugReport.update({ where: { id: bugId }, data: { status: "re_testing" } });
      return fix;
    }
    case "clawqa.escalate": {
      const { cycleId, reason } = args;
      if (!cycleId) throw new Error("cycleId required");
      const cycle = await prisma.testCycle.findUnique({ where: { id: cycleId } });
      if (!cycle) throw new Error("Test cycle not found");
      await prisma.testCycle.update({
        where: { id: cycleId },
        data: { status: "escalated_to_applause" },
      });
      return { success: true, cycleId, message: "Cycle escalated" };
    }
    case "clawqa.get_analytics": {
      const projectWhere = args.projectId ? { projectId: args.projectId } : {};
      const [totalCycles, totalBugs, criticalBugs, openCycles] = await Promise.all([
        prisma.testCycle.count({ where: projectWhere }),
        prisma.bugReport.count(),
        prisma.bugReport.count({ where: { severity: "critical" } }),
        prisma.testCycle.count({ where: { ...projectWhere, status: "open" } }),
      ]);
      return { totalCycles, totalBugs, criticalBugs, openCycles };
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jsonrpc, id, method, params } = body;

    if (jsonrpc !== "2.0") {
      return NextResponse.json({ jsonrpc: "2.0", id, error: { code: -32600, message: "Invalid Request: must use jsonrpc 2.0" } });
    }

    if (method === "initialize") {
      const apiKey = params?.apiKey;
      const user = apiKey ? await authenticateMcp(apiKey) : null;
      return NextResponse.json({
        jsonrpc: "2.0", id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: { name: "ClawQA MCP Server", version: "1.0.0" },
          authenticated: !!user,
        },
      });
    }

    if (method === "tools/list") {
      return NextResponse.json({
        jsonrpc: "2.0", id,
        result: { tools: MCP_TOOLS },
      });
    }

    if (method === "tools/call") {
      const apiKey = params?.apiKey || req.headers.get("authorization")?.replace("Bearer ", "");
      const user = await authenticateMcp(apiKey || "");
      if (!user) {
        return NextResponse.json({
          jsonrpc: "2.0", id,
          error: { code: -32000, message: "Authentication required. Pass apiKey in params or Authorization header." },
        });
      }

      const toolName = params?.name;
      const toolArgs = params?.arguments || {};

      try {
        const result = await executeTool(toolName, toolArgs, user.id);
        return NextResponse.json({
          jsonrpc: "2.0", id,
          result: { content: [{ type: "text", text: JSON.stringify(result) }] },
        });
      } catch (error: any) {
        return NextResponse.json({
          jsonrpc: "2.0", id,
          error: { code: -32000, message: error.message },
        });
      }
    }

    return NextResponse.json({
      jsonrpc: "2.0", id,
      error: { code: -32601, message: `Method not found: ${method}` },
    });
  } catch (error: any) {
    return NextResponse.json({
      jsonrpc: "2.0", id: null,
      error: { code: -32700, message: "Parse error: " + error.message },
    });
  }
}
