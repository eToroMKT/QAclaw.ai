"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function TestPlanDetailPage() {
  const { id } = useParams();
  const [plan, setPlan] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/v1/test-plans/${id}`).then(r => r.json()).then(setPlan);
  }, [id]);

  if (!plan) return <div className="text-gray-400">Loading...</div>;
  if (plan.error) return <div className="text-red-400">{plan.error}</div>;

  const steps = JSON.parse(plan.stepsJson || "[]");
  const deviceReqs = JSON.parse(plan.deviceReqs || "[]");
  const browserReqs = JSON.parse(plan.browserReqs || "[]");

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-white mb-2">{plan.title}</h1>
      <div className="text-sm text-gray-400 mb-6">v{plan.version} • {plan.priority} • {plan.project?.name}</div>

      {plan.description && <p className="text-gray-300 mb-6 bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">{plan.description}</p>}

      <h2 className="text-lg font-semibold text-white mb-3">Steps</h2>
      <div className="space-y-2 mb-6">
        {steps.length === 0 ? <p className="text-gray-500">No steps defined.</p> : steps.map((s: any, i: number) => (
          <div key={i} className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4 flex gap-3">
            <span className="text-blue-400 font-mono">{i + 1}.</span>
            <span className="text-gray-300">{typeof s === "string" ? s : s.description || JSON.stringify(s)}</span>
          </div>
        ))}
      </div>

      {deviceReqs.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-3">Device Requirements</h2>
          <div className="flex flex-wrap gap-2">{deviceReqs.map((d: string, i: number) => (
            <span key={i} className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">{d}</span>
          ))}</div>
        </div>
      )}

      {browserReqs.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-3">Browser Requirements</h2>
          <div className="flex flex-wrap gap-2">{browserReqs.map((b: string, i: number) => (
            <span key={i} className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm">{b}</span>
          ))}</div>
        </div>
      )}

      {plan.history?.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">Version History</h2>
          <div className="space-y-2">
            {plan.history.map((h: any) => (
              <div key={h.id} className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-3 text-sm text-gray-400">
                v{h.version} — {new Date(h.createdAt).toLocaleString()}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
