"use client";
import { useEffect, useState } from "react";

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<any>(null);
  const [trends, setTrends] = useState<any>(null);

  useEffect(() => {
    fetch("/api/v1/analytics?type=overview").then(r => r.json()).then(setOverview);
    fetch("/api/v1/analytics?type=trends").then(r => r.json()).then(setTrends);
  }, []);

  if (!overview) return <div className="text-gray-400">Loading analytics...</div>;

  const severities = overview.bugsBySeverity || {};
  const maxSev = Math.max(...Object.values(severities).map(Number), 1);
  const daily = trends?.daily || [];
  const maxDaily = Math.max(...daily.map((d: any) => Math.max(d.created, d.resolved)), 1);

  // SVG line chart points
  const w = 800, h = 200, pad = 40;
  const xStep = daily.length > 1 ? (w - pad * 2) / (daily.length - 1) : 0;
  const createdPath = daily.map((d: any, i: number) => `${i === 0 ? "M" : "L"}${pad + i * xStep},${h - pad - (d.created / maxDaily) * (h - pad * 2)}`).join(" ");
  const resolvedPath = daily.map((d: any, i: number) => `${i === 0 ? "M" : "L"}${pad + i * xStep},${h - pad - (d.resolved / maxDaily) * (h - pad * 2)}`).join(" ");

  const topBugs = overview.bugsPerProject?.sort((a: any, b: any) => b.bugCount - a.bugCount).slice(0, 10) || [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Bug Report Analytics</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Bugs", value: overview.totalBugs, color: "text-white" },
          { label: "Open Bugs", value: overview.openBugs, color: "text-yellow-400" },
          { label: "Fix Rate", value: `${overview.fixSuccessRate}%`, color: "text-blue-400" },
          { label: "Avg Fix Time", value: `${overview.avgTimeToFix}h`, color: "text-blue-400" },
        ].map((c, i) => (
          <div key={i} className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
            <div className="text-sm text-gray-400">{c.label}</div>
            <div className={`text-3xl font-bold ${c.color} mt-1`}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Severity Distribution */}
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Severity Distribution</h2>
        <div className="space-y-3">
          {Object.entries(severities).map(([sev, count]) => (
            <div key={sev} className="flex items-center gap-4">
              <span className="w-20 text-sm text-gray-400 capitalize">{sev}</span>
              <div className="flex-1 bg-gray-700/50 rounded-full h-6 overflow-hidden">
                <div className={`h-full rounded-full ${sev === "critical" ? "bg-red-500" : sev === "major" ? "bg-orange-500" : sev === "minor" ? "bg-yellow-500" : "bg-blue-500"}`}
                  style={{ width: `${(Number(count) / maxSev) * 100}%` }} />
              </div>
              <span className="text-sm text-gray-300 w-8">{String(count)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bugs Over Time SVG */}
      {daily.length > 0 && (
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Bugs Over Time (30 Days)</h2>
          <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
            <path d={createdPath} fill="none" stroke="#f59e0b" strokeWidth="2" />
            <path d={resolvedPath} fill="none" stroke="#22c55e" strokeWidth="2" />
          </svg>
          <div className="flex gap-6 mt-2 text-sm">
            <span className="text-yellow-400">● Created</span>
            <span className="text-blue-400">● Resolved</span>
          </div>
        </div>
      )}

      {/* Per-Project Breakdown */}
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Per-Project Breakdown</h2>
        <table className="w-full">
          <thead><tr className="text-left text-gray-400 text-sm"><th className="pb-3">Project</th><th className="pb-3">Bugs</th></tr></thead>
          <tbody>
            {topBugs.map((p: any) => (
              <tr key={p.projectId} className="border-t border-gray-700/30">
                <td className="py-2 text-gray-300">{p.name}</td>
                <td className="py-2 text-gray-300">{p.bugCount}</td>
              </tr>
            ))}
            {topBugs.length === 0 && <tr><td colSpan={2} className="py-4 text-gray-500 text-center">No data</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
