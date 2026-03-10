import { prisma } from "./prisma";

interface EscalationCondition {
  severity?: string;
  device?: string;
  status?: string;
}

export async function evaluateEscalationRules(bug: {
  cycleId: string;
  severity: string;
  deviceInfo: string;
  status: string;
  id: string;
}) {
  const cycle = await prisma.testCycle.findUnique({ where: { id: bug.cycleId }, select: { projectId: true } });
  if (!cycle) return;

  const rules = await prisma.escalationRule.findMany({ where: { projectId: cycle.projectId } });

  for (const rule of rules) {
    const condition: EscalationCondition = JSON.parse(rule.condition);
    let matches = true;

    if (condition.severity && condition.severity !== bug.severity) matches = false;
    if (condition.device) {
      const deviceStr = (bug.deviceInfo || "").toLowerCase();
      if (!deviceStr.includes(condition.device.toLowerCase())) matches = false;
    }
    if (condition.status && condition.status !== bug.status) matches = false;

    if (matches) {
      await executeAction(rule.action, rule.targetUrl, bug);
    }
  }
}

async function executeAction(action: string, targetUrl: string, bug: any) {
  if (action === "notify" && targetUrl) {
    fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "escalation.triggered", bug }),
    }).catch(() => {});
  } else if (action === "block-release") {
    await prisma.bugReport.update({
      where: { id: bug.id },
      data: { releaseBlocker: true },
    });
  } else if (action === "escalate") {
    // Trigger CrowdTesting escalation via internal API
    if (targetUrl) {
      fetch(targetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "escalation.premium", bug }),
      }).catch(() => {});
    }
  }
}
