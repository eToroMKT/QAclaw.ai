"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function TestPlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/test-plans").then(r => r.json()).then(d => { setPlans(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  const runPlan = async (id: string) => {
    const res = await fetch(`/api/v1/test-plans/${id}/execute`, { method: "POST" });
    if (res.ok) { const data = await res.json(); alert(`Test cycle created: ${data.testCycle.id}`); }
    else alert("Failed to execute plan. API key required.");
  };

  if (loading) return <div className="text-gray-400">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Test Plans</h1>
      {plans.length === 0 ? (
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-8 text-center text-gray-400">
          No test plans yet. Create one via the API.
        </div>
      ) : (
        <div className="space-y-4">
          {plans.map((p: any) => (
            <div key={p.id} className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 flex items-center justify-between">
              <div>
                <Link href={`/dashboard/test-plans/${p.id}`} className="text-lg font-semibold text-white hover:text-blue-400 transition-colors">{p.title}</Link>
                <div className="text-sm text-gray-400 mt-1">v{p.version} • {p.project?.name} • {p.priority}</div>
              </div>
              <div className="flex gap-3">
                <Link href={`/dashboard/test-plans/${p.id}`} className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors">View</Link>
                <button onClick={() => runPlan(p.id)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors">▶ Run</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
