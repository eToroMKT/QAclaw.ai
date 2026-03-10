"use client";
import { useState, useEffect, useMemo } from "react";

interface Bug {
  id: string; title: string; severity: string; status: string;
  stepsToReproduce: string; expectedResult: string; actualResult: string;
  cycleId: string; reporterId: string; createdAt: string;
  priorityScore: number; releaseBlocker: boolean; deviceInfo: string;
}

const severityColors: Record<string, string> = {
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
  major: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  minor: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  cosmetic: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};
const bugStatusColors: Record<string, string> = {
  new: "bg-blue-500/20 text-blue-400",
  triaged: "bg-blue-500/20 text-blue-400",
  fixing: "bg-yellow-500/20 text-yellow-400",
  re_testing: "bg-purple-500/20 text-purple-400",
  verified: "bg-emerald-500/20 text-emerald-400",
  closed: "bg-gray-500/20 text-gray-400",
};

export default function BugsPage() {
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [sortBy, setSortBy] = useState("priorityScore");

  useEffect(() => {
    fetch("/api/v1/bugs").then(r => r.json()).then(d => { setBugs(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = [...bugs];
    if (filterSeverity) result = result.filter(b => b.severity === filterSeverity);
    if (filterStatus) result = result.filter(b => b.status === filterStatus);
    if (sortBy === "priorityScore") result.sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));
    else if (sortBy === "severity") {
      const order = ["critical", "major", "minor", "cosmetic"];
      result.sort((a, b) => order.indexOf(a.severity) - order.indexOf(b.severity));
    } else result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return result;
  }, [bugs, filterSeverity, filterStatus, sortBy]);

  return (
    <div className="max-w-5xl">
      <h1 className="text-3xl font-bold mb-4">Bug Reports</h1>
      <div className="flex flex-wrap gap-3 mb-6">
        <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white">
          <option value="">All Severities</option>
          <option value="critical">Critical</option>
          <option value="major">Major</option>
          <option value="minor">Minor</option>
          <option value="cosmetic">Cosmetic</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white">
          <option value="">All Statuses</option>
          <option value="new">New</option>
          <option value="triaged">Triaged</option>
          <option value="fixing">Fixing</option>
          <option value="re_testing">Re-testing</option>
          <option value="verified">Verified</option>
          <option value="closed">Closed</option>
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white">
          <option value="priorityScore">Sort by Priority</option>
          <option value="severity">Sort by Severity</option>
          <option value="createdAt">Sort by Date</option>
        </select>
      </div>
      <div className="bg-gray-800/40 backdrop-blur-lg border border-gray-700/50 rounded-2xl p-8">
        {loading ? <p className="text-gray-500">Loading...</p> : filtered.length === 0 ? (
          <p className="text-gray-500">No bug reports found.</p>
        ) : (
          <div className="space-y-2">
            {filtered.map(b => (
              <div key={b.id}>
                <button onClick={() => setExpanded(expanded === b.id ? null : b.id)}
                  className="w-full flex items-center justify-between bg-gray-700/30 rounded-xl px-5 py-4 hover:bg-gray-700/50 transition-colors text-left">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-white">{b.title}</p>
                      {b.releaseBlocker && <span className="px-2 py-0.5 text-xs font-bold bg-red-600/30 text-red-300 border border-red-500/50 rounded-full">🚫 BLOCKER</span>}
                      {b.priorityScore > 0 && <span className="text-xs text-gray-400">P{b.priorityScore}</span>}
                    </div>
                    <p className="text-xs text-gray-400">{new Date(b.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full border ${severityColors[b.severity] || ""}`}>{b.severity}</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${bugStatusColors[b.status] || ""}`}>{b.status}</span>
                  </div>
                </button>
                {expanded === b.id && (
                  <div className="bg-gray-800/50 rounded-b-xl px-5 py-4 border-t border-gray-700/50 space-y-2 text-sm text-gray-300">
                    <p><strong>Steps:</strong> {b.stepsToReproduce || "N/A"}</p>
                    <p><strong>Expected:</strong> {b.expectedResult || "N/A"}</p>
                    <p><strong>Actual:</strong> {b.actualResult || "N/A"}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
