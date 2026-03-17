"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Bug { id: string; title: string; severity: string; status: string; createdAt: string; applauseIssueId?: number | null; }
interface Cycle {
  id: string; title: string; description: string; targetUrl: string;
  priority: string; status: string; stepsJson: string; deviceReqs: string;
  browserReqs?: string; inScope?: string; outOfScope?: string;
  setupInstructions?: string; issueReportingInstructions?: string; buildVersion?: string;
  createdAt: string; project: { id: string; name: string; slug: string; };
  bugReports: Bug[]; testExecutions: any[];
  applauseCycleId?: number | null;
  applauseStatus?: string | null;
  lastSyncedAt?: string | null;
}

interface SyncStatus {
  linked: boolean;
  applauseCycleId?: number | null;
  applauseStatus?: string | null;
  lastSyncedAt?: string | null;
  needsSync?: boolean;
}

interface SyncResult {
  synced?: boolean;
  bugsCreated?: number;
  bugsUpdated?: number;
  totalApplauseBugs?: number;
  cycleStatus?: string | null;
  lastSyncedAt?: string;
  skippedReason?: string;
  error?: string;
}

type DisplayStep = { instruction: string; expectedResult: string };

const priorityColors: Record<string, string> = {
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  normal: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  low: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};
const statusColors: Record<string, string> = {
  open: "bg-blue-500/20 text-blue-400",
  in_progress: "bg-yellow-500/20 text-yellow-400",
  running: "bg-yellow-500/20 text-yellow-400",
  completed: "bg-blue-500/20 text-blue-400",
  escalated_to_applause: "bg-purple-500/20 text-purple-400",
};
const applauseStatusColors: Record<string, string> = {
  active: "bg-green-500/20 text-green-400",
  closed: "bg-gray-500/20 text-gray-400",
  draft: "bg-yellow-500/20 text-yellow-400",
  pending: "bg-orange-500/20 text-orange-400",
};
const statusSteps = ["open", "in_progress", "completed"];

function formatRelativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

function parseStringArray(value: string | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string" && !!item.trim()) : [];
  } catch {
    return [];
  }
}

function parseSteps(value: string | undefined): DisplayStep[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((step): DisplayStep | null => {
        if (typeof step === "string") {
          const instruction = step.trim();
          return instruction ? { instruction, expectedResult: "" } : null;
        }
        if (step && typeof step === "object") {
          const instruction = typeof step.instruction === "string" ? step.instruction.trim() : "";
          const expectedResult = typeof step.expectedResult === "string" ? step.expectedResult.trim() : "";
          return instruction ? { instruction, expectedResult } : null;
        }
        return null;
      })
      .filter((step): step is DisplayStep => !!step);
  } catch {
    return [];
  }
}

function InfoBlock({ title, body }: { title: string; body: string }) {
  if (!body.trim()) return null;
  return (
    <div className="bg-gray-800/40 backdrop-blur-lg border border-gray-700/50 rounded-2xl p-6 mb-6">
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      <p className="text-gray-300 whitespace-pre-wrap">{body}</p>
    </div>
  );
}

export default function TestCycleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [cycle, setCycle] = useState<Cycle | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [crowdTestingStatus, setCrowdTestingStatus] = useState<{ configured: boolean; reachable: boolean; applauseAutoCreateOnEscalate?: boolean; escalationMode?: string } | null>(null);

  const loadCycle = useCallback(() => {
    fetch(`/api/v1/test-cycles/${id}`)
      .then(r => r.json())
      .then(d => { setCycle(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    loadCycle();
    fetch("/api/v1/applause/status")
      .then(r => r.json())
      .then(setCrowdTestingStatus)
      .catch(() => {});
  }, [loadCycle]);

  useEffect(() => {
    if (!cycle) return;
    fetch(`/api/v1/applause/sync?cycleId=${cycle.id}`)
      .then(r => r.json())
      .then(setSyncStatus)
      .catch(() => {});
  }, [cycle?.id]);

  useEffect(() => {
    if (syncStatus?.linked && syncStatus.needsSync && !syncing) {
      handleSync(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncStatus?.linked, syncStatus?.needsSync]);

  if (loading) return <div className="text-gray-500">Loading...</div>;
  if (!cycle) return <div className="text-red-400">Cycle not found</div>;

  const steps = parseSteps(cycle.stepsJson);
  const devices = parseStringArray(cycle.deviceReqs);
  const browsers = parseStringArray(cycle.browserReqs);

  const currentIdx = statusSteps.indexOf(cycle.status);
  const isEscalated = cycle.status === "escalated_to_applause";
  const isLinked = !!(cycle.applauseCycleId || syncStatus?.linked);
  const applauseCycleId = cycle.applauseCycleId || syncStatus?.applauseCycleId;
  const applauseStatus = cycle.applauseStatus || syncStatus?.applauseStatus;
  const lastSyncedAt = cycle.lastSyncedAt || syncStatus?.lastSyncedAt;

  async function escalate() {
    const res = await fetch("/api/v1/escalate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cycleId: cycle!.id }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data.error || "Escalation failed");
      return;
    }

    window.location.reload();
  }

  async function handleSync(force: boolean) {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/v1/applause/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cycleId: cycle!.id, force }),
      });
      const data: SyncResult = await res.json();
      setSyncResult(data);
      if (!data.error && data.synced) {
        setTimeout(() => { loadCycle(); }, 800);
      }
    } catch (e: any) {
      setSyncResult({ error: e.message });
    }
    setSyncing(false);
  }

  return (
    <div className="max-w-4xl">
      <Link href="/dashboard/test-cycles" className="text-sm text-gray-400 hover:text-blue-400 mb-4 inline-block">← Back to Test Cycles</Link>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">{cycle.title}</h1>
          <p className="text-gray-400">{cycle.project.name} · Created {new Date(cycle.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="flex gap-2 items-center flex-wrap justify-end">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${priorityColors[cycle.priority] || ""}`}>{cycle.priority}</span>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColors[cycle.status] || ""}`}>{cycle.status.replace(/_/g, " ")}</span>
          {applauseStatus && (
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${applauseStatusColors[applauseStatus.toLowerCase()] || "bg-purple-500/20 text-purple-400"}`}>
              Applause: {applauseStatus}
            </span>
          )}
        </div>
      </div>

      <div className="bg-gray-800/40 backdrop-blur-lg border border-gray-700/50 rounded-2xl p-4 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
              isLinked && applauseStatus?.toLowerCase() === "active" ? "bg-green-400 animate-pulse" :
              isLinked ? "bg-purple-400" :
              isEscalated ? "bg-purple-400 animate-pulse" :
              crowdTestingStatus?.configured && crowdTestingStatus?.reachable ? "bg-blue-400" :
              crowdTestingStatus?.configured ? "bg-yellow-400" : "bg-gray-500"
            }`} />
            <div>
              <span className="text-sm text-gray-300">
                {isLinked
                  ? `Linked to Applause Cycle #${applauseCycleId}`
                  : isEscalated ? "Escalated to CrowdTesting"
                  : crowdTestingStatus?.configured && crowdTestingStatus?.reachable ? "CrowdTesting Connected"
                  : crowdTestingStatus?.configured ? "CrowdTesting Configured (unreachable)"
                  : "CrowdTesting Not Configured"}
              </span>
              {lastSyncedAt && (
                <p className="text-xs text-gray-500 mt-0.5">Last synced: {formatRelativeTime(lastSyncedAt)}</p>
              )}
              <p className="text-xs text-gray-500 mt-0.5">
                Escalation mode: {crowdTestingStatus?.applauseAutoCreateOnEscalate ? "Auto-create Applause on Escalate" : "Manual handoff on Escalate"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {isLinked && (
              <button
                onClick={() => handleSync(true)}
                disabled={syncing}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <span className={syncing ? "animate-spin inline-block" : ""}>🔄</span>
                {syncing ? "Syncing..." : "Sync from Applause"}
              </button>
            )}
            {isEscalated && !isLinked && (
              <button
                onClick={() => handleSync(false)}
                disabled={syncing}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg transition-all disabled:opacity-50"
              >
                {syncing ? "Syncing..." : "🔄 Sync Results"}
              </button>
            )}
          </div>
        </div>

        {syncResult && (
          <div className={`mt-3 text-sm px-3 py-2 rounded-lg ${syncResult.error ? "bg-red-500/10 text-red-400" : !syncResult.synced ? "bg-gray-700/50 text-gray-400" : "bg-green-500/10 text-green-400"}`}>
            {syncResult.error
              ? `Sync failed: ${syncResult.error}`
              : !syncResult.synced
              ? `Data is fresh — ${syncResult.skippedReason || "sync skipped"}`
              : `Synced successfully · ${syncResult.bugsCreated ?? 0} created, ${syncResult.bugsUpdated ?? 0} updated · ${syncResult.totalApplauseBugs ?? 0} total Applause bugs · Status: ${syncResult.cycleStatus}`}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mb-6">
        {statusSteps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${i <= currentIdx ? "bg-blue-500/20 text-blue-400" : "bg-gray-700/50 text-gray-500"}`}>
              {s.replace(/_/g, " ")}
            </div>
            {i < statusSteps.length - 1 && <span className="text-gray-600">→</span>}
          </div>
        ))}
      </div>

      <InfoBlock title="Summary" body={cycle.description || ""} />
      <InfoBlock title="In Scope" body={cycle.inScope || ""} />
      <InfoBlock title="Out of Scope" body={cycle.outOfScope || ""} />
      <InfoBlock title="Setup Instructions" body={cycle.setupInstructions || ""} />
      <InfoBlock title="Issue Reporting Instructions" body={cycle.issueReportingInstructions || ""} />
      <InfoBlock title="Build Version" body={cycle.buildVersion || ""} />

      <div className="bg-gray-800/40 backdrop-blur-lg border border-gray-700/50 rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-semibold mb-1">Target URL</h2>
        <a href={cycle.targetUrl} target="_blank" rel="noopener" className="text-blue-400 hover:underline break-all">{cycle.targetUrl}</a>
      </div>

      {devices.length > 0 && (
        <div className="bg-gray-800/40 backdrop-blur-lg border border-gray-700/50 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-3">Device Requirements</h2>
          <div className="flex flex-wrap gap-2">
            {devices.map(d => <span key={d} className="text-xs bg-gray-700/50 text-gray-300 px-3 py-1 rounded-full">{d}</span>)}
          </div>
        </div>
      )}

      {browsers.length > 0 && (
        <div className="bg-gray-800/40 backdrop-blur-lg border border-gray-700/50 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-3">Browser Requirements</h2>
          <div className="flex flex-wrap gap-2">
            {browsers.map(browser => <span key={browser} className="text-xs bg-gray-700/50 text-gray-300 px-3 py-1 rounded-full">{browser}</span>)}
          </div>
        </div>
      )}

      <div className="bg-gray-800/40 backdrop-blur-lg border border-gray-700/50 rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-semibold mb-3">Test Steps ({steps.length})</h2>
        <div className="space-y-3">
          {steps.map((s, i) => (
            <div key={i} className="flex gap-3 items-start bg-gray-700/30 rounded-xl px-4 py-3">
              <span className="text-blue-400 font-bold text-sm mt-0.5">{i + 1}</span>
              <div className="flex-1">
                <p className="text-white text-sm">{s.instruction}</p>
                {s.expectedResult && <p className="text-gray-400 text-xs mt-1">Expected: {s.expectedResult}</p>}
              </div>
            </div>
          ))}
          {steps.length === 0 && <p className="text-gray-500">No test steps recorded.</p>}
        </div>
      </div>

      <div className="bg-gray-800/40 backdrop-blur-lg border border-gray-700/50 rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-semibold mb-3">Bug Reports ({cycle.bugReports.length})</h2>
        {cycle.bugReports.length === 0 ? (
          <p className="text-gray-500">No bugs reported yet.</p>
        ) : (
          <div className="space-y-2">
            {cycle.bugReports.map(b => (
              <div key={b.id} className="flex items-center justify-between bg-gray-700/30 rounded-xl px-4 py-3">
                <span className="text-white text-sm">{b.title}</span>
                <div className="flex gap-2 items-center">
                  {b.applauseIssueId && (
                    <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full">#{b.applauseIssueId}</span>
                  )}
                  <span className="text-xs bg-gray-700/50 text-gray-300 px-2 py-1 rounded-full">{b.severity}</span>
                  <span className="text-xs bg-gray-700/50 text-gray-300 px-2 py-1 rounded-full">{b.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {cycle.status !== "escalated_to_applause" && (
        <button onClick={escalate}
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-700 text-white font-medium rounded-lg hover:from-purple-400 hover:to-purple-600 transition-all">
          Escalate to Testers
        </button>
      )}
    </div>
  );
}
